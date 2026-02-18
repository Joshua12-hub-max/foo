import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { authentication, bioEnrolledUsers, schedules } from '../db/schema.js';
import { eq, or, and, sql, gt, getTableColumns, desc } from 'drizzle-orm';
import { AuthService } from '../services/auth.service.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import type { AuthenticatedRequest } from '../types/index.js';
import { allocateDefaultCredits } from './leaveController.js';
import { 
  LoginSchema, 
  RegisterSchema, 
  VerifyOTPSchema, 
  EmailVerifySchema, 
  ResendOTPSchema, 
  ForgotPasswordSchema, 
  ResetPasswordSchema,
  GoogleLoginSchema
} from '../schemas/authSchema.js';
import { UserRole, EmploymentStatus } from '../types/index.js';

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

// interfaces removed, using Drizzle types and schema definitions

/**
 * Strictly maps an internal user/employee object to the Auth API response format.
 * Ensures consistency between /auth/me and /user/ profile data.
 */
const mapToAuthUser = (user: any): any => {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    role: user.role as UserRole,
    department: user.department,
    employeeId: user.employeeId,
    avatarUrl: user.avatarUrl,
    jobTitle: user.jobTitle,
    employmentStatus: user.employmentStatus as EmploymentStatus,
    twoFactorEnabled: !!user.twoFactorEnabled,
    duties: user.duties || 'No Schedule'
  };
};

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
  try {
    const { credential } = GoogleLoginSchema.parse(req.body);
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

    const { sub: googleId, email, picture: avatar } = payload;
    if (!email) {
      res.status(400).json({ message: 'Google account missing email' });
      return;
    }

    const user = await db.query.authentication.findFirst({
      where: eq(authentication.email, email),
      with: {
        schedules: {
          limit: 1,
          orderBy: [desc(schedules.updatedAt)],
          columns: { scheduleTitle: true }
        }
      } as const 
    });


    if (!user) {
      res.status(403).json({
        success: false,
        message: 'Account not found. Please register manually via the Employee Portal.'
      });
      return;
    }

    // CHECK TERMINATION STATUS
    if (user.employmentStatus === 'Terminated') {
      res.status(403).json({
        success: false,
        message: 'Access Denied: Your account has been terminated. Please contact HR.',
        data: null
      });
      return;
    }

    // BIOMETRIC ENFORCEMENT: Check bio_enrolled_users (C# biometric data)
    const isCHRMO = (user.department && (
      user.department.toUpperCase().includes('CHRMO') || 
      user.department.toUpperCase().includes('HUMAN RESOURCE')
    )) || (user.employeeId && user.employeeId.toUpperCase().startsWith('CHRMO'));

    if (user.role !== 'admin' && !isCHRMO) {
      // Extract numeric ID from EMP-XXX format
      const bioIdMatch = user.employeeId?.match(/EMP-(\d+)/);
      const bioId = bioIdMatch ? parseInt(bioIdMatch[1], 10) : 0;

      const [enrolled] = await db.select().from(bioEnrolledUsers).where(
        and(
          eq(bioEnrolledUsers.employeeId, bioId),
          eq(bioEnrolledUsers.userStatus, 'active')
        )
      ).limit(1);

      if (!enrolled) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: You are not yet registered in the biometric system. Please contact your HR Administrator to complete your enrollment.',
          code: 'BIOMETRIC_NOT_ENROLLED'
        });
        return;
      }
    }

    // Link Google ID if missing
    if (!user.googleId) {
      await db.update(authentication)
        .set({ googleId, avatarUrl: avatar })
        .where(eq(authentication.id, user.id));
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await db.update(authentication)
      .set({ twoFactorOtp: otp, twoFactorOtpExpires: otpExpires.toISOString() })
      .where(eq(authentication.id, user.id));

    try {
      await sendOTPEmail(user.email, user.firstName || 'User', otp, 'Google Login Verification', 'You are attempting to login via Google.');
    } catch (emailErr) {
      console.error('Failed to send Google 2FA OTP:', emailErr);
      res.status(500).json({ success: false, message: 'Failed to send verification code.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to email',
      data: {
        requires2FA: true,
        identifier: user.email,
        maskedEmail: maskEmail(user.email)
      }
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

/**
 * GET /api/auth/verify-enrollment/:employeeId
 * PUBLIC endpoint — checks if employee is enrolled in biometrics.
 * Returns name + department from bio_enrolled_users.
 */
export const verifyEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    
    // Parse the input — accept "1", "001", or "EMP-001"
    let bioId: number;
    const empMatch = employeeId.match(/EMP-(\d+)/i);
    if (empMatch) {
      bioId = parseInt(empMatch[1], 10);
    } else {
      bioId = parseInt(employeeId, 10);
    }

    if (isNaN(bioId) || bioId <= 0) {
      res.status(400).json({ success: false, message: 'Invalid Employee ID format.' });
      return;
    }

    // Check bio_enrolled_users
    const [enrolled] = await db.select().from(bioEnrolledUsers).where(
      and(
        eq(bioEnrolledUsers.employeeId, bioId),
        eq(bioEnrolledUsers.userStatus, 'active')
      )
    ).limit(1);

    if (!enrolled) {
      res.status(404).json({
        success: false,
        message: 'Employee ID not found in biometric enrollment. Please contact HR to enroll first.',
        code: 'NOT_ENROLLED'
      });
      return;
    }

    // Convert to system ID format
    const systemEmployeeId = `EMP-${String(bioId).padStart(3, '0')}`;

    // Check if already registered in the web system
    const [existingAccount] = await db.select({ employeeId: authentication.employeeId })
      .from(authentication)
      .where(eq(authentication.employeeId, systemEmployeeId))
      .limit(1);

    res.status(200).json({
      success: true,
      message: 'Employee is enrolled in biometrics.',
      data: {
        bioEmployeeId: bioId,
        systemEmployeeId,
        fullName: enrolled.fullName,
        department: enrolled.department,
        enrolledAt: enrolled.enrolledAt,
        alreadyRegistered: !!existingAccount
      }
    });
  } catch (error) {
    console.error('Verify Enrollment Error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify enrollment.' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    const { employee_id, email, password, role } = validatedData;

    // 1. Parse bio ID from input
    let bioId: number;
    const empMatch = employee_id.match(/EMP-(\d+)/i);
    if (empMatch) {
      bioId = parseInt(empMatch[1], 10);
    } else {
      bioId = parseInt(employee_id, 10);
    }

    if (isNaN(bioId) || bioId <= 0) {
      res.status(400).json({ success: false, message: 'Invalid Employee ID format.', data: null });
      return;
    }

    // 2. Verify biometric enrollment — MUST be enrolled to register
    const [enrolled] = await db.select().from(bioEnrolledUsers).where(
      and(
        eq(bioEnrolledUsers.employeeId, bioId),
        eq(bioEnrolledUsers.userStatus, 'active')
      )
    ).limit(1);

    if (!enrolled) {
      res.status(403).json({
        success: false,
        message: 'You are not enrolled in the biometric system. Please contact HR to enroll first.',
        code: 'NOT_ENROLLED',
        data: null
      });
      return;
    }

    // 3. Convert to system employee ID format
    const employeeId = `EMP-${String(bioId).padStart(3, '0')}`;

    // 4. Auto-pull name + department from biometric enrollment
    const nameParts = enrolled.fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    const department = enrolled.department || 'Unassigned';

    // 5. Check if already registered
    const existingUser = await db.query.authentication.findFirst({
      where: or(
        eq(authentication.employeeId, employeeId),
        eq(authentication.email, email)
      )
    });

    if (existingUser) {
      if (existingUser.email === email) {
        res.status(409).json({ success: false, message: 'Email already exists.', data: null });
        return;
      }
      res.status(409).json({ success: false, message: 'This Employee ID is already registered.', data: null });
      return;
    }

    // 6. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 7. Generate Verification OTP
    const verificationOTP = generateOTP();

    // 8. Insert user — name + department auto-pulled from bio_enrolled_users
    await db.insert(authentication).values({
      firstName,
      lastName,
      email,
      role: role || 'employee',
      department,
      employeeId,
      passwordHash: hashedPassword,
      isVerified: 0,
      verificationToken: verificationOTP
    });

    // 9. AUTO-ALLOCATION: Assign default leave credits
    await allocateDefaultCredits(employeeId);

    // 10. Send Verification Email
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email credentials are not configured.');
      }
      await sendOTPEmail(email, firstName, verificationOTP, 'Email Verification', 'Thank you for registering. Please use the code below to verify your email address:');
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
      data: { email, employeeId, fullName: enrolled.fullName, department }
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
    const user = await db.query.authentication.findFirst({
      where: and(
        eq(authentication.email, email),
        eq(authentication.verificationToken, otp)
      )
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid OTP or Email.' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ success: false, message: 'User is already verified.' });
      return;
    }

    await AuthService.updateUser(user.id, { isVerified: 1, verificationToken: null });

    res.status(200).json({ success: true, message: 'Email verified successfully. You can now login.' });
  } catch (err) {
    console.error('Verification Error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body); // Reuse simple email schema
    const user = await db.query.authentication.findFirst({
      where: eq(authentication.email, email)
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ success: false, message: 'Email is already verified.' });
      return;
    }

    const verificationOTP = generateOTP();
    await db.update(authentication)
      .set({ verificationToken: verificationOTP })
      .where(eq(authentication.id, user.id));

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials are not configured.');
    }

    await sendOTPEmail(email, user.firstName, verificationOTP, 'Resend: Verify Your Email', 'You requested a new verification code.');

    res.status(200).json({ success: true, message: 'Verification code resent successfully.' });
  } catch (error) {
    console.error('Resend Verification Error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend verification code.' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body);
    const user = await db.query.authentication.findFirst({
      where: eq(authentication.email, email)
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await db.update(authentication)
      .set({ resetPasswordToken: resetToken, resetPasswordExpires: resetExpires.toISOString() })
      .where(eq(authentication.id, user.id));

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - NEBR',
      html: `
        <h1>Password Reset</h1>
        <p>Hi ${user.firstName},</p>
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
    const user = await db.query.authentication.findFirst({
      where: and(
        eq(authentication.resetPasswordToken, token),
        gt(authentication.resetPasswordExpires, sql`NOW()`)
      )
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired token.' });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.update(authentication)
      .set({ 
        passwordHash: hashedPassword, 
        resetPasswordToken: null, 
        resetPasswordExpires: null 
      })
      .where(eq(authentication.id, user.id));

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

    const [user] = await db.select({
      ...getTableColumns(authentication),
      duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} ORDER BY updated_at DESC LIMIT 1), 'No Schedule')`
    })
    .from(authentication)
    .where(eq(authentication.id, userId as number));

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: mapToAuthUser(user)
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

    const user = await AuthService.findUserByIdentifier(identifier);
    
    if (!user) {
      console.log(`[LOGIN FAIL] User not found for identifier: ${identifier}`);
      res.status(401).json({ success: false, message: 'Invalid Credentials' });
      return;
    }
    console.log(`[LOGIN FOUND] User: ${user.email} | Role: ${user.role} | Verified: ${user.isVerified}`);

    if (!user.isVerified) {
      console.log(`[LOGIN FAIL] User not verified`);
      res.status(403).json({
        success: false,
        message: 'Email not verified. Please check your email.',
        data: null
      });
      return;
    }

    // CHECK TERMINATION STATUS
    if (user.employmentStatus === 'Terminated') {
      console.log(`[LOGIN FAIL] User is Terminated: ${user.email}`);
      res.status(403).json({
        success: false,
        message: 'Access Denied: Your account has been terminated. Please contact HR.',
        data: null
      });
      return;
    }

    // BIOMETRIC ENFORCEMENT: Check bio_enrolled_users (C# biometric data)
    const isCHRMO = (user.department && (
      user.department.toUpperCase().includes('CHRMO') || 
      user.department.toUpperCase().includes('HUMAN RESOURCE')
    )) || (user.employeeId && user.employeeId.toUpperCase().startsWith('CHRMO'));

    if (user.role !== 'admin' && !isCHRMO) {
      // Extract numeric ID from EMP-XXX format
      const bioIdMatch = user.employeeId?.match(/EMP-(\d+)/);
      const bioId = bioIdMatch ? parseInt(bioIdMatch[1], 10) : 0;

      const [enrolled] = await db.select().from(bioEnrolledUsers).where(
        and(
          eq(bioEnrolledUsers.employeeId, bioId),
          eq(bioEnrolledUsers.userStatus, 'active')
        )
      ).limit(1);

      if (!enrolled) {
        console.log(`[LOGIN FAIL] Biometric not enrolled for: ${user.employeeId}`);
        res.status(403).json({
          success: false,
          message: 'Access Denied: You are not yet registered in the biometric system. Please contact your HR Administrator to complete your enrollment.',
          code: 'BIOMETRIC_NOT_ENROLLED',
          data: null
        });
        return;
      }
      console.log(`[LOGIN SUCCESS] Biometric enrollment verification passed.`);
    } else if (isCHRMO) {
      console.log(`[LOGIN SUCCESS] Biometric enrollment bypassed for CHRMO employee: ${user.employeeId}`);
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash || '');

    if (!isPasswordCorrect) {
      console.log(`[LOGIN FAIL] Password mismatch for ${user.email}`);
      res.status(401).json({ success: false, message: 'Invalid Credentials', data: null });
      return;
    }

    // Check for 2FA
    if (user.twoFactorEnabled) {
      console.log(`[LOGIN 2FA] 2FA required for ${user.email}`);
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      await db.update(authentication)
        .set({ twoFactorOtp: otp, twoFactorOtpExpires: otpExpires.toISOString() })
        .where(eq(authentication.id, user.id));

      try {
        await sendOTPEmail(user.email, user.firstName, otp, 'Your Login OTP', 'Your One-Time Password (OTP) for login is:');
      } catch (emailErr) {
        console.error('Failed to send 2FA OTP:', emailErr);
        res.status(500).json({ success: false, message: 'Failed to send 2FA code.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: '2FA Verification Required',
        data: {
          requires2FA: true,
          identifier: user.email,
          maskedEmail: maskEmail(user.email)
        }
      });
      return;
    }

    // Generate token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        employeeId: user.employeeId, 
        role: user.role.toLowerCase() 
      },
      jwtSecret,
      { expiresIn: '1d' }
    );

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Fetch schedule for the logged in user to include in response
    const [userSchedule] = await db.select({
      duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE employee_id = ${user.employeeId} ORDER BY updated_at DESC LIMIT 1), 'No Schedule')`
    }).from(authentication).where(eq(authentication.id, user.id));

    console.log(`[LOGIN SUCCESS] Token generated for ${user.email}`);
    res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: mapToAuthUser({
        ...user,
        duties: (userSchedule as any)?.duties || 'No Schedule'
      })
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
    const user = await db.query.authentication.findFirst({
      where: or(
        eq(authentication.employeeId, identifier),
        eq(authentication.email, identifier)
      )
    });

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found.' });
      return;
    }

    if (!user.twoFactorOtp || !user.twoFactorOtpExpires) {
      res.status(400).json({ success: false, message: 'No OTP request found. Please login again.' });
      return;
    }

    if (new Date() > new Date(user.twoFactorOtpExpires)) {
      res.status(400).json({ success: false, message: 'OTP has expired. Please login again.' });
      return;
    }

    if (user.twoFactorOtp !== otp) {
      res.status(400).json({ success: false, message: 'Invalid OTP.' });
      return;
    }

    // Clear OTP
    await db.update(authentication)
      .set({ twoFactorOtp: null, twoFactorOtpExpires: null })
      .where(eq(authentication.id, user.id));

    // Generate Token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      { id: user.id, employeeId: user.employeeId, role: user.role },
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
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId
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
    await db.update(authentication)
      .set({ twoFactorEnabled: 1 })
      .where(eq(authentication.id, userId));
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
    await db.update(authentication)
      .set({ twoFactorEnabled: 0 })
      .where(eq(authentication.id, userId));
    res.status(200).json({ success: true, message: 'Two-factor authentication disabled.' });
  } catch (err) {
    console.error('Disable 2FA Error:', err);
    res.status(500).json({ success: false, message: 'Failed to disable 2FA.' });
  }
};

export const resendTwoFactorOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = ResendOTPSchema.parse(req.body);
    const user = await db.query.authentication.findFirst({
      where: or(
        eq(authentication.employeeId, identifier),
        eq(authentication.email, identifier)
      )
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await db.update(authentication)
      .set({ twoFactorOtp: otp, twoFactorOtpExpires: otpExpires.toISOString() })
      .where(eq(authentication.id, user.id));

    await sendOTPEmail(user.email, user.firstName, otp, 'New Login OTP', 'You requested a new One-Time Password (OTP) for login:');

    res.status(200).json({ success: true, message: 'OTP resent successfully.' });
  } catch (err) {
    console.error('Resend OTP Error:', err);
    res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
  }
};

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await db.select({
      id: authentication.id,
      employee_id: authentication.employeeId,
      first_name: authentication.firstName,
      last_name: authentication.lastName,
      email: authentication.email,
      department: authentication.department,
      position_title: authentication.positionTitle,
      job_title: authentication.jobTitle,
      employment_status: authentication.employmentStatus,
      role: authentication.role,
      avatar_url: authentication.avatarUrl,
      two_factor_enabled: authentication.twoFactorEnabled,
      duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} ORDER BY updated_at DESC LIMIT 1), 'No Schedule')`
    }).from(authentication).orderBy(authentication.lastName);

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
    const [user] = await db.select({
      ...getTableColumns(authentication),
      duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} ORDER BY updated_at DESC LIMIT 1), 'No Schedule')`
    })
    .from(authentication)
    .where(eq(authentication.id, Number(id)));

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Fetch Manager Name if managerId exists
    let supervisor: string | null = null;
    if (user.managerId) {
      const manager = await db.query.authentication.findFirst({
        where: eq(authentication.id, user.managerId)
      });
      if (manager) {
        supervisor = `${manager.firstName} ${manager.lastName}`;
      }
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully.',
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

    const updates = req.body;
    const file = req.file;

    let avatarUrl: string | undefined;
    if (file) {
      avatarUrl = `http://localhost:5000/uploads/avatars/${file.filename}`;
    }

    // Fetch current user to compare email
    const currentUser = await db.query.authentication.findFirst({
      where: eq(authentication.id, userId),
      columns: { email: true, id: true }
    });

    if (!currentUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const mappedUpdates: any = {};
    if (updates.first_name) mappedUpdates.firstName = updates.first_name;
    if (updates.last_name) mappedUpdates.lastName = updates.last_name;
    
    // Only reset verification if email CHANGED
    if (updates.email && updates.email !== currentUser.email) {
      mappedUpdates.email = updates.email;
      mappedUpdates.isVerified = 0;
      mappedUpdates.verificationToken = null;
    }

    if (updates.phone_number !== undefined) mappedUpdates.phoneNumber = updates.phone_number;
    if (updates.birth_date !== undefined) mappedUpdates.birthDate = updates.birth_date;
    if (updates.gender !== undefined) mappedUpdates.gender = updates.gender;
    if (updates.civil_status !== undefined) mappedUpdates.civilStatus = updates.civil_status;
    if (updates.nationality !== undefined) mappedUpdates.nationality = updates.nationality;
    if (updates.blood_type !== undefined) mappedUpdates.bloodType = updates.blood_type;
    if (updates.height_cm !== undefined) mappedUpdates.heightCm = updates.height_cm;
    if (updates.weight_kg !== undefined) mappedUpdates.weightKg = updates.weight_kg;
    if (updates.address !== undefined) mappedUpdates.address = updates.address;
    if (updates.permanent_address !== undefined) mappedUpdates.permanentAddress = updates.permanent_address;
    if (updates.emergency_contact !== undefined) mappedUpdates.emergencyContact = updates.emergency_contact;
    if (updates.emergency_contact_number !== undefined) mappedUpdates.emergencyContactNumber = updates.emergency_contact_number;

    // Government IDs
    if (updates.sss_number !== undefined) mappedUpdates.sssNumber = updates.sss_number;
    if (updates.gsis_number !== undefined) mappedUpdates.gsisNumber = updates.gsis_number;
    if (updates.philhealth_number !== undefined) mappedUpdates.philhealthNumber = updates.philhealth_number;
    if (updates.pagibig_number !== undefined) mappedUpdates.pagibigNumber = updates.pagibig_number;
    if (updates.tin_number !== undefined) mappedUpdates.tinNumber = updates.tin_number;

    // Avatar
    if (avatarUrl) mappedUpdates.avatarUrl = avatarUrl;

    if (Object.keys(mappedUpdates).length === 0) {
      // If no changes, still return success to avoid frontend error states
      // but fetch the current user to return their data
      const [user] = await db.select({
        ...getTableColumns(authentication),
        duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} ORDER BY updated_at DESC LIMIT 1), 'No Schedule')`
      })
      .from(authentication)
      .where(eq(authentication.id, userId));

      res.json({
        success: true,
        message: 'No changes detected',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName} ${user.lastName}`.trim(),
          role: user.role,
          department: user.department,
          employeeId: user.employeeId,
          avatarUrl: user.avatarUrl,
          jobTitle: user.jobTitle,
          employmentStatus: user.employmentStatus,
          twoFactorEnabled: !!user.twoFactorEnabled,
          duties: user.duties
        }
      });
      return;
    }

    await db.update(authentication)
      .set(mappedUpdates)
      .where(eq(authentication.id, userId));

    // Fetch updated user with duties
    const [updatedUser] = await db.select({
      ...getTableColumns(authentication),
      duties: sql<string>`COALESCE((SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} ORDER BY updated_at DESC LIMIT 1), 'No Schedule')`
    })
    .from(authentication)
    .where(eq(authentication.id, userId));

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
        role: updatedUser.role,
        department: updatedUser.department,
        employeeId: updatedUser.employeeId,
        avatarUrl: updatedUser.avatarUrl,
        jobTitle: updatedUser.jobTitle,
        employmentStatus: updatedUser.employmentStatus,
        twoFactorEnabled: !!updatedUser.twoFactorEnabled,
        duties: updatedUser.duties
      }
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
