import db from '../db/connection.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Configure Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your preferred service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Application-specific password
  }
});

export const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: "Google credential is required" });
  }

  try {
    // 1. Verify the Google Token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: avatar } = payload;

    // 2. Check if user exists
    const [users] = await db.query("SELECT * FROM authentication WHERE email = ?", [email]);
    
    let user;

    if (users.length === 0) {
      // 3. Create new user
      // Auto-generate Employee ID
      const autoEmployeeId = `G-${Date.now().toString().slice(-6)}`;
      
      // Default department and role for new Google users (or handle as pending)
      const defaultRole = 'employee'; 
      const defaultDepartment = 'General';

      const [result] = await db.query(
        "INSERT INTO authentication (first_name, last_name, email, role, department, employee_id, google_id, avatar_url, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)",
        [firstName, lastName, email, defaultRole, defaultDepartment, autoEmployeeId, googleId, avatar]
      );
      
      user = {
        id: result.insertId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        role: defaultRole,
        department: defaultDepartment,
        employee_id: autoEmployeeId,
        is_verified: true
      };
      
    } else {
      user = users[0];
      // Update google_id if not present (link account)
      if (!user.google_id) {
        await db.query("UPDATE authentication SET google_id = ?, avatar_url = ?, is_verified = TRUE WHERE id = ?", [googleId, avatar, user.id]);
      }
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user.id, employeeId: user.employee_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 5. Send Response WITH COOKIE
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.status(200).json({
      success: true,
      message: "Google login successful",
      data: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employee_id,
        avatar: avatar
      }
    });

  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
};

export const register = async (req, res) => {
  const { name, email, role, department, password } = req.body; // Removed employeeId from destructuring

  // 1. Validate input (employeeId is now optional for manual registration)
  if (!name || !email || !role || !department || !password) {
    return res.status(400).json({ 
      success: false, 
      message: "Name, email, role, department, and password are required.", 
      data: null 
    });
  }

  // Validate Email Format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format.",
      data: null
    });
  }

  try {
    // Auto-generate employeeId if not provided (for manual registration)
    const autoEmployeeId = `EMP-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`; // Simple unique ID

    // 2. Check if user already exists (using auto-generated employeeId or email)
    const [existingUser] = await db.query(
      "SELECT * FROM authentication WHERE employee_id = ? OR email = ?",
      [autoEmployeeId, email] // Use autoEmployeeId for check
    );

    if (existingUser.length > 0) {
      // This might indicate a collision with the auto-generated ID, or email already exists.
      // For simplicity, if autoEmployeeId collides, we can retry, but for now, we'll just report email exists if that's the case.
      // More robust solution would be to ensure autoEmployeeId uniqueness or retry generation.
      if (existingUser[0].email === email) {
        return res.status(409).json({
          success: false,
          message: "Email already exists.", // More specific message
          data: null
        });
      } else {
        return res.status(409).json({
          success: false,
          message: "Could not generate a unique employee ID. Please try again.", // Or retry logic
          data: null
        });
      }
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nameParts = name.split(" ");
    const first_name = nameParts[0];
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

    // 4. Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 5. Insert user into database (is_verified = FALSE)
    await db.query(
      "INSERT INTO authentication (first_name, last_name, email, role, department, employee_id, password_hash, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, ?)",
      [first_name, last_name, email, role, department, autoEmployeeId, hashedPassword, verificationToken] // Use autoEmployeeId here
    );

    // 6. Send Verification Email
    // 6. Send Verification Email
    const verificationLink = `${process.env.API_URL}/api/auth/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email - NEBR',
      html: `
        <h1>Email Verification</h1>
        <p>Hi ${first_name},</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email credentials are not configured.");
      }
      await transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email}`);
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr);
      // We still return success for user creation, but warn about email
      return res.status(201).json({ 
        success: true, 
        message: "User created, but failed to send verification email. Please contact support.",
        data: null
      });
    }

    return res.status(201).json({ 
      success: true, 
      message: "User created! Please check your email to verify your account.",
      data: null 
    });

  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "An unexpected error occurred during registration.",
      data: null 
    });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("<h1>Invalid Link</h1>");
  }

  try {
    const [users] = await db.query("SELECT * FROM authentication WHERE verification_token = ?", [token]);

    if (users.length === 0) {
      return res.status(400).send("<h1>Invalid or Expired Token</h1>");
    }

    const user = users[0];

    await db.query(
      "UPDATE authentication SET is_verified = TRUE, verification_token = NULL WHERE id = ?",
      [user.id]
    );

    // Redirect to frontend success page
    // Assuming frontend runs on port 5173 by default in Vite
    // Redirect to frontend success page
    res.redirect(`${process.env.CLIENT_URL}/verify-email?status=success`);

  } catch (err) {
    console.error("Verification Error:", err);
    res.status(500).send("<h1>Server Error</h1>");
  }
};

export const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }

  try {
    const [users] = await db.query("SELECT * FROM authentication WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = users[0];

    if (user.is_verified) {
      return res.status(400).json({ success: false, message: "Email is already verified." });
    }

    // Generate NEW Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await db.query("UPDATE authentication SET verification_token = ? WHERE id = ?", [verificationToken, user.id]);

    const verificationLink = `${process.env.API_URL}/api/auth/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Resend: Verify Your Email - NEBR',
      html: `
        <h1>Email Verification</h1>
        <p>Hi ${user.first_name},</p>
        <p>You requested to resend your verification email.</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email credentials are not configured.");
    }

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: "Verification email resent successfully." });

  } catch (error) {
    console.error("Resend Verification Error:", error);
    return res.status(500).json({ success: false, message: "Failed to resend verification email." });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required." });
  }

  try {
    const [users] = await db.query("SELECT * FROM authentication WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = users[0];

    // Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await db.query(
      "UPDATE authentication SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?",
      [resetToken, resetExpires, user.id]
    );

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - NEBR',
      html: `
        <h1>Password Reset</h1>
        <p>Hi ${user.first_name},</p>
        <p>You requested a password reset. Please click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error("Email credentials are not configured.");
    }

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, message: "Password reset email sent." });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ success: false, message: "Failed to send password reset email." });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ success: false, message: "Token and new password are required." });
  }

  try {
    const [users] = await db.query(
      "SELECT * FROM authentication WHERE reset_password_token = ? AND reset_password_expires > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired token." });
    }

    const user = users[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query(
      "UPDATE authentication SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    return res.status(200).json({ success: true, message: "Password reset successfully. You can now login." });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ success: false, message: "Failed to reset password." });
  }
};

export const getMe = async (req, res) => {
  try {
    // User is already attached to req by verifyToken middleware (which we need to ensure is used)
    // If not using middleware yet, we'd verify token here. 
    // But typically getMe is protected.
    // For now, let's extract from header if not in req.user
    
    let userId;
    if (req.user) {
      userId = req.user.id;
    } else {
       // Fallback manual verification if middleware isn't set up globally yet
       const token = req.headers.authorization?.split(" ")[1];
       if (!token) return res.status(401).json({ message: "Not authenticated" });
       
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       userId = decoded.id;
    }

    const [users] = await db.query(
      "SELECT id, first_name, last_name, email, role, department, employee_id, avatar_url FROM authentication WHERE id = ?", 
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = users[0];

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employee_id,
        avatar: user.avatar_url
      }
    });

  } catch (error) {
    console.error("GetMe Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: "Email/Employee ID and password are required.",
      data: null
    });
  }

  try {
    // 1. Query by employee_id OR email
    const [users] = await db.query(
      "SELECT * FROM authentication WHERE employee_id = ? OR email = ?",
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid Credentials", data: null });
    }

    const user = users[0];

    // 2. Check if Verified
    if (!user.is_verified) {
      return res.status(403).json({ 
        success: false, 
        message: "Email not verified. Please check your email.",
        data: null 
      });
    }

    // 3. Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "Invalid Credentials", data: null });
    }

    // 4. Generate token
    const token = jwt.sign(
      { id: user.id, employeeId: user.employee_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 5. Send Response WITH COOKIE
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    // 6. Send Response
    return res.status(200).json({
      success: true,
      message: "Login successful!",
      data: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employee_id
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ 
      success: false, 
      message: "An unexpected error occurred during login.",
      data: null 
    });
  }
};
    
    export const getUsers = async (req, res) => {
      try {
        const [users] = await db.query(
          "SELECT id, employee_id, first_name, last_name, department FROM authentication ORDER BY last_name ASC"
        );
    
        return res.status(200).json({
          success: true,
          message: "Users retrieved successfully.",
          data: users
        });
    
      } catch (err) {
        console.error("Get Users Error:", err);
        return res.status(500).json({
          success: false,
          message: "An unexpected error occurred while fetching users.",
          data: null
        });
      }
    };
    

export const logout = (req, res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
