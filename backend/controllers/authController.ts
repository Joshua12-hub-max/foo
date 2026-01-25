import { Request, Response } from 'express';
import db from '../db/connection.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import type { RowDataPacket } from 'mysql2/promise';
import type { AuthenticatedRequest, UserRow, JwtPayload } from '../types/index.js';
import { allocateDefaultCredits } from './leaveController.js';
import { 
  LoginSchema, 
  RegisterSchema, 
  VerifyOTPSchema, 
  EmailVerifySchema, 
  ResendOTPSchema, 
  ForgotPasswordSchema, 
  ResetPasswordSchema 
} from '../schemas/authSchema.js';

// Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ============================================================================
// Interfaces
// ============================================================================

interface LoginRequest {
  identifier: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  department: string;
  password: string;
  role?: string;
}

interface OTPRequest {
  identifier: string;
  otp: string;
}

interface EmailVerifyRequest {
  email: string;
  otp: string;
}

interface PasswordResetRequest {
  token: string;
  newPassword: string;
}

interface ProfileUpdateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  birth_date?: string;
  gender?: string;
  civil_status?: string;
  nationality?: string;
  blood_type?: string;
  height_cm?: number;
  weight_kg?: number;
  address?: string;
  permanent_address?: string;
  emergency_contact?: string;
  emergency_contact_number?: string;
  sss_number?: string;
  gsis_number?: string;
  philhealth_number?: string;
  pagibig_number?: string;
  tin_number?: string;
}

interface FingerprintRow extends RowDataPacket {
  fingerprint_id: number;
  employee_id: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Mask email for display (e.g., jo***@email.com)
 */
const maskEmail = (email: string): string => {
  return email.replace(/(.{2})(.*)(?=@)/, (_, g1, g2) => g1 + '*'.repeat(g2.length));
};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send OTP email
 */
const sendOTPEmail = async (
  to: string,
  firstName: string,
  otp: string,
  subject: string,
  purpose: string
): Promise<void> => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `${subject} - NEBR`,
    html: `
      <h1>${subject}</h1>
      <p>Hi ${firstName},</p>
      <p>${purpose}</p>
      <h2 style="font-size: 24px; font-weight: bold; letter-spacing: 5px;">${otp}</h2>
      <p>This code expires in 10 minutes.</p>
    `
  };
  await transporter.sendMail(mailOptions);
};

// ============================================================================
// Auth Controllers
// ============================================================================

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400).json({ message: 'Google credential is required' });
    return;
  }

  try {
    // Verify Google Token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ message: 'Invalid Google token' });
      return;
    }

    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture: avatar } = payload;

    // Check if user exists
    const [users] = await db.query<UserRow[]>(
      'SELECT * FROM authentication WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      res.status(403).json({
        success: false,
        message: 'Account not found. Please register manually via the Employee Portal.'
      });
      return;
    }

    const user = users[0];

    // CHECK TERMINATION STATUS
    if (user.employment_status === 'Terminated') {
      res.status(403).json({
        success: false,
        message: 'Access Denied: Your account has been terminated. Please contact HR.',
        data: null
      });
      return;
    }

    // BIOMETRIC ENFORCEMENT: Check if employee is enrolled
    if (user.role !== 'admin') {
      const [fingerprint] = await db.query<FingerprintRow[]>(
        'SELECT fingerprint_id FROM fingerprints WHERE employee_id = ?',
        [user.employee_id]
      );

      if (fingerprint.length === 0) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: You are not yet registered in the biometric system. Please contact your HR Administrator to complete your enrollment.',
          code: 'BIOMETRIC_NOT_ENROLLED'
        });
        return;
      }
    }

    // Link Google ID if missing
    if (!user.google_id) {
      await db.query(
        'UPDATE authentication SET google_id = ?, avatar_url = ? WHERE id = ?',
        [googleId, avatar, user.id]
      );
    }

    // Generate and send OTP
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      'UPDATE authentication SET two_factor_otp = ?, two_factor_otp_expires = ? WHERE id = ?',
      [otp, otpExpires, user.id]
    );

    try {
      await sendOTPEmail(user.email, user.first_name, otp, 'Google Login Verification', 'You are attempting to login via Google.');
    } catch (emailErr) {
      console.error('Failed to send Google 2FA OTP:', emailErr);
      res.status(500).json({ success: false, message: 'Failed to send verification code.' });
      return;
    }

    res.status(200).json({
      success: true,
      requires2FA: true,
      message: 'Verification code sent to email',
      identifier: user.email,
      maskedEmail: maskEmail(user.email)
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    const { employee_id, name, email, department, password, role } = validatedData;
    // Determine role
    let assignedRole = 'employee';
    if (role && ['admin', 'hr', 'employee'].includes(role.toLowerCase())) {
      assignedRole = role.toLowerCase();
    }

    // Use provided employee_id or auto-generate
    const employeeId = employee_id || `EMP-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;

    // Check if user already exists
    const [existingUser] = await db.query<UserRow[]>(
      'SELECT * FROM authentication WHERE employee_id = ? OR email = ?',
      [employeeId, email]
    );

    if (existingUser.length > 0) {
      if (existingUser[0].email === email) {
        res.status(409).json({ success: false, message: 'Email already exists.', data: null });
        return;
      }
      res.status(409).json({ success: false, message: 'Could not generate a unique employee ID. Please try again.', data: null });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const nameParts = name.split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Generate Verification OTP
    const verificationOTP = generateOTP();

    // Insert user into database
    await db.query(
      'INSERT INTO authentication (first_name, last_name, email, role, department, employee_id, password_hash, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, ?)',
      [first_name, last_name, email, assignedRole, department, employeeId, hashedPassword, verificationOTP]
    );

    // AUTO-ALLOCATION: Assign default leave credits
    await allocateDefaultCredits(employeeId);

    // Send Verification Email
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email credentials are not configured.');
      }
      await sendOTPEmail(email, first_name, verificationOTP, 'Email Verification', 'Thank you for registering. Please use the code below to verify your email address:');
    } catch (emailErr) {
      console.error('Failed to send email:', emailErr);
      res.status(201).json({
        success: true,
        message: 'User created, but failed to send verification email. Please contact support.',
        data: null
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the verification code.',
      data: { email }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during registration.',
      data: null
    });
  }
};

export const verifyRegistrationOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = EmailVerifySchema.parse(req.body);
    const [users] = await db.query<UserRow[]>(
      'SELECT * FROM authentication WHERE email = ? AND verification_token = ?',
      [email, otp]
    );

    if (users.length === 0) {
      res.status(400).json({ success: false, message: 'Invalid OTP or Email.' });
      return;
    }

    const user = users[0];

    if (user.is_verified) {
      res.status(400).json({ success: false, message: 'User is already verified.' });
      return;
    }

    await db.query(
      'UPDATE authentication SET is_verified = TRUE, verification_token = NULL WHERE id = ?',
      [user.id]
    );

    res.status(200).json({ success: true, message: 'Email verified successfully. You can now login.' });
  } catch (err) {
    console.error('Verification Error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body); // Reuse simple email schema
    const [users] = await db.query<UserRow[]>('SELECT * FROM authentication WHERE email = ?', [email]);

    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const user = users[0];

    if (user.is_verified) {
      res.status(400).json({ success: false, message: 'Email is already verified.' });
      return;
    }

    const verificationOTP = generateOTP();
    await db.query('UPDATE authentication SET verification_token = ? WHERE id = ?', [verificationOTP, user.id]);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials are not configured.');
    }

    await sendOTPEmail(email, user.first_name, verificationOTP, 'Resend: Verify Your Email', 'You requested a new verification code.');

    res.status(200).json({ success: true, message: 'Verification code resent successfully.' });
  } catch (error) {
    console.error('Resend Verification Error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend verification code.' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body);
    const [users] = await db.query<UserRow[]>('SELECT * FROM authentication WHERE email = ?', [email]);

    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const user = users[0];
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await db.query(
      'UPDATE authentication SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
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
      throw new Error('Email credentials are not configured.');
    }

    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Password reset email sent.' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send password reset email.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = ResetPasswordSchema.parse(req.body);
    const [users] = await db.query<UserRow[]>(
      'SELECT * FROM authentication WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      res.status(400).json({ success: false, message: 'Invalid or expired token.' });
      return;
    }

    const user = users[0];
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE authentication SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const [users] = await db.query<UserRow[]>('SELECT * FROM authentication WHERE id = ?', [userId]);

    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const user = users[0];

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        department: user.department,
        employeeId: user.employee_id,
        avatar: user.avatar_url,
        jobTitle: user.job_title,
        positionTitle: user.position_title,
        itemNumber: user.item_number,
        salaryGrade: user.salary_grade,
        stepIncrement: user.step_increment,
        dateHired: user.date_hired,
        employmentStatus: user.employment_status,
        birth_date: user.birth_date,
        gender: user.gender,
        civil_status: user.civil_status,
        nationality: user.nationality,
        blood_type: user.blood_type,
        permanent_address: user.permanent_address,
        emergency_contact: user.emergency_contact,
        emergency_contact_number: user.emergency_contact_number,
        sss_number: user.sss_number,
        gsis_number: user.gsis_number,
        philhealth_number: user.philhealth_number,
        pagibig_number: user.pagibig_number,
        tin_number: user.tin_number,
        twoFactorEnabled: !!user.two_factor_enabled
      }
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = LoginSchema.parse(req.body);
    console.log(`[LOGIN ATTEMPT] Identifier: ${identifier}`);

    const [users] = await db.query<UserRow[]>(
      'SELECT * FROM authentication WHERE employee_id = ? OR email = ?',
      [identifier, identifier]
    );

    if (users.length === 0) {
      console.log(`[LOGIN FAIL] User not found for identifier: ${identifier}`);
      res.status(401).json({ success: false, message: 'Invalid Credentials', data: null });
      return;
    }

    const user = users[0];
    console.log(`[LOGIN FOUND] User: ${user.email} | Role: ${user.role} | Verified: ${user.is_verified}`);

    if (!user.is_verified) {
      console.log(`[LOGIN FAIL] User not verified`);
      res.status(403).json({
        success: false,
        message: 'Email not verified. Please check your email.',
        data: null
      });
      return;
    }

    // CHECK TERMINATION STATUS
    if (user.employment_status === 'Terminated') {
      console.log(`[LOGIN FAIL] User is Terminated: ${user.email}`);
      res.status(403).json({
        success: false,
        message: 'Access Denied: Your account has been terminated. Please contact HR.',
        data: null
      });
      return;
    }

    // BIOMETRIC ENFORCEMENT: Check if employee is enrolled
    if (user.role !== 'admin') {
      const [fingerprint] = await db.query<FingerprintRow[]>(
        'SELECT fingerprint_id FROM fingerprints WHERE employee_id = ?',
        [user.employee_id]
      );

      if (fingerprint.length === 0) {
        console.log(`[LOGIN FAIL] Biometric not enrolled for: ${user.employee_id}`);
        res.status(403).json({
          success: false,
          message: 'Access Denied: You are not yet registered in the biometric system. Please contact your HR Administrator to complete your enrollment.',
          code: 'BIOMETRIC_NOT_ENROLLED',
          data: null
        });
        return;
      }
      console.log(`[LOGIN SUCCESS] Biometric enrollment verification passed.`);
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordCorrect) {
      console.log(`[LOGIN FAIL] Password mismatch for ${user.email}`);
      res.status(401).json({ success: false, message: 'Invalid Credentials', data: null });
      return;
    }

    // Check for 2FA
    if (user.two_factor_enabled) {
      console.log(`[LOGIN 2FA] 2FA required for ${user.email}`);
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      await db.query(
        'UPDATE authentication SET two_factor_otp = ?, two_factor_otp_expires = ? WHERE id = ?',
        [otp, otpExpires, user.id]
      );

      try {
        await sendOTPEmail(user.email, user.first_name, otp, 'Your Login OTP', 'Your One-Time Password (OTP) for login is:');
      } catch (emailErr) {
        console.error('Failed to send 2FA OTP:', emailErr);
        res.status(500).json({ success: false, message: 'Failed to send 2FA code.' });
        return;
      }

      res.status(200).json({
        success: true,
        requires2FA: true,
        message: '2FA Verification Required',
        identifier: user.email,
        maskedEmail: maskEmail(user.email)
      });
      return;
    }

    // Generate token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      { id: user.id, employeeId: user.employee_id, role: user.role },
      jwtSecret,
      { expiresIn: '1d' }
    );

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    console.log(`[LOGIN SUCCESS] Token generated for ${user.email}`);
    res.status(200).json({
      success: true,
      message: 'Login successful!',
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
    console.error('Login Error:', err);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during login.',
      data: null
    });
  }
};

export const verifyTwoFactorOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, otp } = VerifyOTPSchema.parse(req.body);
    const [users] = await db.query<UserRow[]>(
      'SELECT * FROM authentication WHERE employee_id = ? OR email = ?',
      [identifier, identifier]
    );

    if (users.length === 0) {
      res.status(401).json({ success: false, message: 'User not found.' });
      return;
    }

    const user = users[0];

    if (!user.two_factor_otp || !user.two_factor_otp_expires) {
      res.status(400).json({ success: false, message: 'No OTP request found. Please login again.' });
      return;
    }

    if (new Date() > new Date(user.two_factor_otp_expires)) {
      res.status(400).json({ success: false, message: 'OTP has expired. Please login again.' });
      return;
    }

    if (user.two_factor_otp !== otp) {
      res.status(400).json({ success: false, message: 'Invalid OTP.' });
      return;
    }

    // Clear OTP
    await db.query(
      'UPDATE authentication SET two_factor_otp = NULL, two_factor_otp_expires = NULL WHERE id = ?',
      [user.id]
    );

    // Generate Token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      { id: user.id, employeeId: user.employee_id, role: user.role },
      jwtSecret,
      { expiresIn: '1d' }
    );

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: 'Login successful!',
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
    console.error('2FA Verify Error:', err);
    res.status(500).json({ success: false, message: 'Verification failed.' });
  }
};

export const enableTwoFactor = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  try {
    await db.query('UPDATE authentication SET two_factor_enabled = TRUE WHERE id = ?', [userId]);
    res.status(200).json({ success: true, message: 'Two-factor authentication enabled.' });
  } catch (err) {
    console.error('Enable 2FA Error:', err);
    res.status(500).json({ success: false, message: 'Failed to enable 2FA.' });
  }
};

export const disableTwoFactor = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user.id;

  try {
    await db.query('UPDATE authentication SET two_factor_enabled = FALSE WHERE id = ?', [userId]);
    res.status(200).json({ success: true, message: 'Two-factor authentication disabled.' });
  } catch (err) {
    console.error('Disable 2FA Error:', err);
    res.status(500).json({ success: false, message: 'Failed to disable 2FA.' });
  }
};

export const resendTwoFactorOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = ResendOTPSchema.parse(req.body);
    const [users] = await db.query<UserRow[]>(
      'SELECT * FROM authentication WHERE employee_id = ? OR email = ?',
      [identifier, identifier]
    );

    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const user = users[0];
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      'UPDATE authentication SET two_factor_otp = ?, two_factor_otp_expires = ? WHERE id = ?',
      [otp, otpExpires, user.id]
    );

    await sendOTPEmail(user.email, user.first_name, otp, 'New Login OTP', 'You requested a new One-Time Password (OTP) for login:');

    res.status(200).json({ success: true, message: 'OTP resent successfully.' });
  } catch (err) {
    console.error('Resend OTP Error:', err);
    res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const [users] = await db.query<UserRow[]>(
      'SELECT id, employee_id, first_name, last_name, email, department, job_title, employment_status, role, avatar_url, two_factor_enabled FROM authentication ORDER BY last_name ASC'
    );

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully.',
      data: users
    });
  } catch (err) {
    console.error('Get Users Error:', err);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while fetching users.',
      data: null
    });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [users] = await db.query<UserRow[]>(
      'SELECT id, employee_id, first_name, last_name, email, department, job_title, employment_status, date_hired, manager_id, role, avatar_url, two_factor_enabled FROM authentication WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const user = users[0];

    // Fetch Manager Name if manager_id exists
    let supervisor: string | null = null;
    if (user.manager_id) {
      const [managers] = await db.query<UserRow[]>(
        'SELECT first_name, last_name FROM authentication WHERE id = ?',
        [user.manager_id]
      );
      if (managers.length > 0) {
        supervisor = `${managers[0].first_name} ${managers[0].last_name}`;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        ...user,
        supervisor
      }
    });
  } catch (err) {
    console.error('Get User By ID Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch user details' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user ? authReq.user.id : null;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const {
      first_name, last_name, email, phone_number,
      birth_date, gender, civil_status, nationality, blood_type,
      height_cm, weight_kg, address,
      permanent_address, emergency_contact, emergency_contact_number,
      sss_number, gsis_number, philhealth_number, pagibig_number, tin_number
    }: ProfileUpdateRequest = req.body;

    const file = req.file;

    let avatarUrl: string | undefined;
    if (file) {
      avatarUrl = `http://localhost:5000/uploads/avatars/${file.filename}`;
    }

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    // Fetch current user to compare email
    const [currentUserResult] = await db.query<UserRow[]>('SELECT email, is_verified FROM authentication WHERE id = ?', [userId]);
    const currentUser = currentUserResult[0];

    // Personal Info
    if (first_name) { updates.push('first_name = ?'); params.push(first_name); }
    if (last_name) { updates.push('last_name = ?'); params.push(last_name); }
    
    // Only reset verification if email CHANGED
    if (email && email !== currentUser.email) {
      updates.push('email = ?');
      params.push(email);
      updates.push('is_verified = FALSE');
      updates.push('verification_token = NULL');
    } else if (email) {
      // Email was sent but didn't change, just update it (redundant but harmless) or ignore
      // updates.push('email = ?'); params.push(email); 
      // Actually if it matches, no need to update, but no harm either unless strict uniqueness affects itself? 
      // Uniqueness check typically excludes self.
      // Let's just NOT add it if it matches, to be safe.
    }
    if (phone_number !== undefined) { updates.push('phone_number = ?'); params.push(phone_number); }
    if (birth_date !== undefined) { updates.push('birth_date = ?'); params.push(birth_date || null); }
    if (gender !== undefined) { updates.push('gender = ?'); params.push(gender); }
    if (civil_status !== undefined) { updates.push('civil_status = ?'); params.push(civil_status); }
    if (nationality !== undefined) { updates.push('nationality = ?'); params.push(nationality); }
    if (blood_type !== undefined) { updates.push('blood_type = ?'); params.push(blood_type); }
    if (height_cm !== undefined) { updates.push('height_cm = ?'); params.push(height_cm); }
    if (weight_kg !== undefined) { updates.push('weight_kg = ?'); params.push(weight_kg); }
    if (address !== undefined) { updates.push('address = ?'); params.push(address); }
    if (permanent_address !== undefined) { updates.push('permanent_address = ?'); params.push(permanent_address); }
    if (emergency_contact !== undefined) { updates.push('emergency_contact = ?'); params.push(emergency_contact); }
    if (emergency_contact_number !== undefined) { updates.push('emergency_contact_number = ?'); params.push(emergency_contact_number); }

    // Government IDs
    if (sss_number !== undefined) { updates.push('sss_number = ?'); params.push(sss_number); }
    if (gsis_number !== undefined) { updates.push('gsis_number = ?'); params.push(gsis_number); }
    if (philhealth_number !== undefined) { updates.push('philhealth_number = ?'); params.push(philhealth_number); }
    if (pagibig_number !== undefined) { updates.push('pagibig_number = ?'); params.push(pagibig_number); }
    if (tin_number !== undefined) { updates.push('tin_number = ?'); params.push(tin_number); }

    // Avatar
    if (avatarUrl) { updates.push('avatar_url = ?'); params.push(avatarUrl); }

    if (updates.length === 0) {
      res.status(400).json({ success: false, message: 'No changes provided' });
      return;
    }

    params.push(userId);

    await db.query(`UPDATE authentication SET ${updates.join(', ')} WHERE id = ?`, params);

    // Fetch updated user
    const [users] = await db.query<UserRow[]>('SELECT * FROM authentication WHERE id = ?', [userId]);
    const user = users[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employee_id,
        avatar: user.avatar_url,
        jobTitle: user.job_title,
        positionTitle: user.position_title,
        itemNumber: user.item_number,
        salaryGrade: user.salary_grade,
        stepIncrement: user.step_increment
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

export const logout = (req: Request, res: Response): void => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
