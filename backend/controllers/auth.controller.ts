import { Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import { authentication, bioEnrolledUsers, schedules, recruitmentApplicants } from '../db/schema.js';
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
import { UserRole, EmploymentStatus, Gender, CivilStatus } from '../types/index.js';

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

interface UserData {
  id: number;
  email: string;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  suffix: string | null;
  role: string;
  department: string | null;
  employeeId: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  employmentStatus: string | null;
  twoFactorEnabled: number | null;
  dateHired: string | null;
  address: string | null;
  residentialAddress: string | null;
  permanentAddress: string | null;
  emergencyContact: string | null;
  emergencyContactNumber: string | null;
  educationalBackground: string | null;
  duties?: string;
  loginAttempts?: number | null;
  lockUntil?: string | null;
}

/**
 * Strictly maps an internal user/employee object to the Auth API response format.
 * Ensures consistency between /auth/me and /user/ profile data.
 */
const mapToAuthUser = (user: UserData) => {
  const parts = [];
  if (user.lastName) parts.push(`${user.lastName},`);
  if (user.firstName) parts.push(user.firstName);
  if (user.middleName) parts.push(`${user.middleName.charAt(0)}.`);
  if (user.suffix) parts.push(user.suffix);

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    suffix: user.suffix,
    name: parts.join(' ').trim(),
    role: user.role as UserRole,
    department: user.department,
    employeeId: user.employeeId,
    avatarUrl: user.avatarUrl,
    jobTitle: user.jobTitle,
    employmentStatus: user.employmentStatus as EmploymentStatus,
    twoFactorEnabled: !!user.twoFactorEnabled,
    dateHired: user.dateHired,
    address: user.address,
    residentialAddress: user.residentialAddress,
    permanentAddress: user.permanentAddress,
    emergencyContact: user.emergencyContact,
    emergencyContactNumber: user.emergencyContactNumber,
    educationalBackground: user.educationalBackground,
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
      // Extract numeric ID from EMP-XXX format OR use raw ID
      let bioId = 0;
      if (user.employeeId) {
        const bioIdMatch = user.employeeId.match(/EMP-(\d+)/);
        if (bioIdMatch) {
             bioId = parseInt(bioIdMatch[1], 10);
        } else {
             bioId = parseInt(user.employeeId, 10);
        }
      }

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
    const { employeeId } = req.params as { employeeId: string };
    
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
    // NOW CHANGED: Use raw ID string (e.g. "1") instead of "EMP-001"
    const systemEmployeeId = String(bioId);

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
    const { employee_id, email, password } = validatedData;
    const file = req.file;

    // 1. Parse bio ID from input
    let bioId: number;
    const empMatch = employee_id?.match(/EMP-(\d+)/i);
    if (empMatch) {
      bioId = parseInt(empMatch[1], 10);
    } else {
      bioId = parseInt(employee_id || '0', 10);
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
    const employeeId = String(bioId);

    // 4. Use provided name if available, otherwise pull from bio_enrolled_users
    const firstName = validatedData.firstName || enrolled.fullName.split(' ')[0];
    const lastName = validatedData.lastName || (enrolled.fullName.split(' ').length > 1 ? enrolled.fullName.split(' ').slice(1).join(' ') : '');
    const department = validatedData.department || enrolled.department || 'Unassigned';

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

    // New: Homonym (Duplicate Name) Detection
    if (!validatedData.ignoreDuplicateWarning) {
        const nameMatch = await db.query.authentication.findFirst({
            where: and(
                eq(authentication.firstName, firstName),
                eq(authentication.lastName, lastName)
            )
        });
        if (nameMatch) {
            res.status(409).json({ 
                success: false, 
                message: `An employee named "${firstName} ${lastName}" is already registered. If this is a different person with the same name, please confirm to proceed.`, 
                code: 'DUPLICATE_NAME'
            });
            return;
        }
    }

    // 6. Handle Avatar Upload (or copy from applicant photo)
    let avatarUrl: string | null = null;
    if (file) {
        avatarUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/avatars/${file.filename}`;
    } else if (validatedData.applicantPhotoPath) {
        // Copy applicant's ID photo from applications to avatars
        try {
            const srcPath = path.join(process.cwd(), 'uploads', 'applications', validatedData.applicantPhotoPath);
            if (fs.existsSync(srcPath)) {
                const destFilename = `applicant_${Date.now()}${path.extname(validatedData.applicantPhotoPath)}`;
                const destDir = path.join(process.cwd(), 'uploads', 'avatars');
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }
                const destPath = path.join(destDir, destFilename);
                fs.copyFileSync(srcPath, destPath);
                avatarUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/avatars/${destFilename}`;
            }
        } catch (copyErr) {
            console.error('Failed to copy applicant photo:', copyErr);
        }
    }

    // 7. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 8. Generate Verification OTP
    const verificationOTP = generateOTP();

    // 9. Determine Portal Role & Parse Position
    let assignedRole: 'admin' | 'hr' | 'employee' = 'employee';
    const rawPos = validatedData.position || '';
    
    // Extract "Title" from "Title (Item Number)"
    const posMatch = rawPos.match(/^(.*)\s\((.*)\)$/);
    const positionTitle = posMatch ? posMatch[1].trim() : rawPos;
    const itemNumber = posMatch ? posMatch[2].trim() : null;

    const posTitleLower: string = positionTitle.toLowerCase();
    const deptLower: string = (validatedData.department || '').toLowerCase();

    if (deptLower === 'city human resource management office' && posTitleLower.includes('department head')) {
        assignedRole = 'hr';
    } else if (posTitleLower.includes('administrative')) {
        assignedRole = 'admin';
    }

    // 10. Insert user
    await db.insert(authentication).values({
      firstName,
      lastName,
      middleName: validatedData.middleName,
      suffix: validatedData.suffix,
      email,
      role: assignedRole,
      department,
      employeeId,
      passwordHash: hashedPassword,
      isVerified: 0,
      verificationToken: verificationOTP,
      avatarUrl,
      // Work Info
      jobTitle: positionTitle,
      positionTitle: positionTitle,
      itemNumber: itemNumber,
      dateHired: validatedData.applicantHiredDate || new Date().toISOString().split('T')[0],
      // Personal Info
      birthDate: validatedData.birthDate,
      placeOfBirth: validatedData.placeOfBirth,
      gender: (validatedData.gender || undefined) as Gender | undefined,
      civilStatus: (validatedData.civilStatus || undefined) as CivilStatus | undefined,
      nationality: validatedData.nationality || 'Filipino',
      bloodType: validatedData.bloodType,
      heightM: validatedData.heightM,
      weightKg: validatedData.weightKg,

      // Address & Contact
      address: validatedData.address || validatedData.residentialAddress || undefined,
      residentialAddress: validatedData.residentialAddress || validatedData.address || undefined,
      residentialZipCode: validatedData.residentialZipCode,
      permanentAddress: validatedData.permanentAddress,
      permanentZipCode: validatedData.permanentZipCode,
      mobileNo: validatedData.mobileNo,
      telephoneNo: validatedData.telephoneNo,
      emergencyContact: validatedData.emergencyContact,
      emergencyContactNumber: validatedData.emergencyContactNumber,

      // Government Identification (Mapping to both sets of columns for compatibility)
      umidNo: validatedData.umidId,
      philsysId: validatedData.philsysId,
      gsisNumber: validatedData.gsisIdNo,
      gsisIdNo: validatedData.gsisIdNo,
      pagibigNumber: validatedData.pagibigIdNo,
      pagibigIdNo: validatedData.pagibigIdNo,
      philhealthNumber: validatedData.philhealthNo,
      philhealthNo: validatedData.philhealthNo,
      tinNumber: validatedData.tinNo,
      tinNo: validatedData.tinNo,
      agencyEmployeeNo: validatedData.agencyEmployeeNo,

      // Others
      educationalBackground: validatedData.educationalBackground,
      facebookUrl: validatedData.facebookUrl,
      linkedinUrl: validatedData.linkedinUrl,
      twitterHandle: validatedData.twitterHandle,
      dutyType: validatedData.duties === 'Irregular Duties' ? 'Irregular' : 'Standard',
    });

    // 10. AUTO-ALLOCATION: Assign default leave credits
    await allocateDefaultCredits(employeeId);

    // 11. Send Verification Email
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email credentials are not configured.');
      }
      await sendOTPEmail(email, firstName, verificationOTP, 'Email Verification', 'Thank you for registering. Please use the code below to verify your email address:');
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the verification code.',
      data: { email, employeeId, fullName: `${firstName} ${lastName}`, department }
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: err.issues
      });
      return;
    }

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
    console.log(`[LOGIN ATTEMPT] Identifier: "${identifier}", Password length: ${password.length}`);

    const user = await AuthService.findUserByIdentifier(identifier);
    console.log(`[LOGIN DEBUG] User found: ${user ? 'YES' : 'NO'} (ID: ${user?.id}, EmpID: ${user?.employeeId})`);
    
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

    // NEW: Check for account lock
    if (user.lockUntil) {
        const lockDate = new Date(user.lockUntil);
        if (lockDate > new Date()) {
            const minutesLeft = Math.ceil((lockDate.getTime() - Date.now()) / (60 * 1000));
            console.log(`[LOGIN FAIL] Account locked for ${user.email} until ${user.lockUntil}`);
            res.status(403).json({ 
                success: false, 
                message: `Account is temporarily locked due to multiple failed attempts. Please try again in ${minutesLeft} minutes.`,
                code: 'ACCOUNT_LOCKED'
            });
            return;
        }
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
      // Extract numeric ID from EMP-XXX format OR use raw ID
      let bioId = 0;
      if (user.employeeId) {
        const bioIdMatch = user.employeeId.match(/EMP-(\d+)/);
        if (bioIdMatch) {
             bioId = parseInt(bioIdMatch[1], 10);
        } else {
             bioId = parseInt(user.employeeId, 10);
        }
      }

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

    const passwordMatch = await bcrypt.compare(password, user.passwordHash || '');

    if (!passwordMatch) {
      console.log(`[LOGIN FAIL] Password mismatch for ${user.email}`);
      
      const newAttempts = (user.loginAttempts || 0) + 1;
      const updateData: { loginAttempts: number; lockUntil?: string | null } = { loginAttempts: newAttempts };
      
      if (newAttempts >= 5) {
          const lockTime = new Date(Date.now() + 30 * 60 * 1000); // 30 mins lock
          updateData.lockUntil = lockTime.toISOString();
          
          // Send security alert
          try {
              const mailOptions = {
                  from: process.env.EMAIL_USER,
                  to: user.email,
                  subject: 'Security Alert: Account Locked',
                  text: `Your account has been temporarily locked for 30 minutes due to 5 consecutive failed login attempts. If this wasn't you, please reset your password immediately.`
              };
              await transporter.sendMail(mailOptions);
          } catch (e) {
              console.error('Failed to send lock alert email:', e);
          }
      }

      await db.update(authentication).set(updateData).where(eq(authentication.id, user.id));

      const message = newAttempts >= 5 
        ? 'Too many failed attempts. Your account has been locked for 30 minutes.'
        : `Invalid Credentials. ${5 - newAttempts} attempts remaining before account lock.`;

      res.status(401).json({ success: false, message, data: null });
      return;
    }

    // Reset attempts on successful login
    if (user.loginAttempts && user.loginAttempts > 0) {
        await db.update(authentication)
            .set({ loginAttempts: 0, lockUntil: null })
            .where(eq(authentication.id, user.id));
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
        id: Number(user.id), 
        employeeId: String(user.employeeId),
        role: String(user.role)
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
        duties: userSchedule?.duties || 'No Schedule'
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

    const updates = req.body as Record<string, string | number | undefined>;
    const file = req.file;

    let avatarUrl: string | undefined;
    if (file) {
      avatarUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/avatars/${file.filename}`;
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

    const mappedUpdates: Partial<typeof authentication.$inferInsert> = {};
    if (updates.first_name) mappedUpdates.firstName = String(updates.first_name);
    if (updates.last_name) mappedUpdates.lastName = String(updates.last_name);
    if (updates.middle_name) mappedUpdates.middleName = String(updates.middle_name);
    if (updates.suffix !== undefined) mappedUpdates.suffix = String(updates.suffix);
    
    // Only reset verification if email CHANGED
    if (updates.email && updates.email !== currentUser.email) {
      mappedUpdates.email = String(updates.email);
      mappedUpdates.isVerified = 0;
      mappedUpdates.verificationToken = null;
    }

    if (updates.phone_number !== undefined) mappedUpdates.mobileNo = String(updates.phone_number);
    if (updates.mobile_no !== undefined) mappedUpdates.mobileNo = String(updates.mobile_no);
    if (updates.telephone_no !== undefined) mappedUpdates.telephoneNo = String(updates.telephone_no);
    if (updates.birth_date !== undefined) {
        mappedUpdates.birthDate = String(updates.birth_date);
        mappedUpdates.dateOfBirth = String(updates.birth_date);
    }
    if (updates.place_of_birth !== undefined) mappedUpdates.placeOfBirth = String(updates.place_of_birth);
    if (updates.gender !== undefined) mappedUpdates.gender = updates.gender as "Male" | "Female";
    if (updates.civil_status !== undefined) mappedUpdates.civilStatus = updates.civil_status as "Single" | "Married" | "Widowed" | "Separated" | "Annulled";
    if (updates.nationality !== undefined) mappedUpdates.nationality = String(updates.nationality);
    
    if (updates.address !== undefined) mappedUpdates.address = String(updates.address);
    if (updates.residential_address !== undefined) mappedUpdates.residentialAddress = String(updates.residential_address);
    if (updates.residential_zip_code !== undefined) mappedUpdates.residentialZipCode = String(updates.residential_zip_code);
    if (updates.permanent_address !== undefined) mappedUpdates.permanentAddress = String(updates.permanent_address);
    if (updates.permanent_zip_code !== undefined) mappedUpdates.permanentZipCode = String(updates.permanent_zip_code);
    
    if (updates.emergency_contact !== undefined) mappedUpdates.emergencyContact = String(updates.emergency_contact);
    if (updates.emergency_contact_number !== undefined) mappedUpdates.emergencyContactNumber = String(updates.emergency_contact_number);
    
    if (updates.umid_id !== undefined) mappedUpdates.umidNo = String(updates.umid_id);
    if (updates.philsys_id !== undefined) mappedUpdates.philsysId = String(updates.philsys_id);
    if (updates.gsis_number !== undefined) {
        mappedUpdates.gsisNumber = String(updates.gsis_number);
        mappedUpdates.gsisIdNo = String(updates.gsis_number);
    }
    if (updates.philhealth_number !== undefined) {
        mappedUpdates.philhealthNumber = String(updates.philhealth_number);
        mappedUpdates.philhealthNo = String(updates.philhealth_number);
    }
    if (updates.pagibig_number !== undefined) {
        mappedUpdates.pagibigNumber = String(updates.pagibig_number);
        mappedUpdates.pagibigIdNo = String(updates.pagibig_number);
    }
    if (updates.tin_number !== undefined) {
        mappedUpdates.tinNumber = String(updates.tin_number);
        mappedUpdates.tinNo = String(updates.tin_number);
    }
    if (updates.agency_employee_no !== undefined) mappedUpdates.agencyEmployeeNo = String(updates.agency_employee_no);
    
    if (updates.educational_background !== undefined) mappedUpdates.educationalBackground = String(updates.educational_background);
    if (updates.highest_education !== undefined) mappedUpdates.highestEducation = String(updates.highest_education);
    if (updates.eligibility_type !== undefined) mappedUpdates.eligibilityType = String(updates.eligibility_type);
    if (updates.eligibility_number !== undefined) mappedUpdates.eligibilityNumber = String(updates.eligibility_number);
    if (updates.eligibility_date !== undefined) mappedUpdates.eligibilityDate = String(updates.eligibility_date);
    if (updates.years_of_experience !== undefined) mappedUpdates.yearsOfExperience = Number(updates.years_of_experience);
    
    if (updates.blood_type !== undefined) mappedUpdates.bloodType = String(updates.blood_type);
    if (updates.height_m !== undefined) mappedUpdates.heightM = String(updates.height_m);
    if (updates.weight_kg !== undefined) mappedUpdates.weightKg = String(updates.weight_kg);
    
    if (updates.facebook_url !== undefined) mappedUpdates.facebookUrl = String(updates.facebook_url);
    if (updates.linkedin_url !== undefined) mappedUpdates.linkedinUrl = String(updates.linkedin_url);
    if (updates.twitter_handle !== undefined) mappedUpdates.twitterHandle = String(updates.twitter_handle);
    
    if (updates.position_title !== undefined) mappedUpdates.positionTitle = String(updates.position_title);
    if (updates.item_number !== undefined) mappedUpdates.itemNumber = String(updates.item_number);
    if (updates.salary_grade !== undefined) mappedUpdates.salaryGrade = String(updates.salary_grade);
    if (updates.step_increment !== undefined) mappedUpdates.stepIncrement = Number(updates.step_increment);
    if (updates.appointment_type !== undefined) mappedUpdates.appointmentType = updates.appointment_type as 'Permanent' | 'Contractual' | 'Casual' | 'Job Order' | 'Coterminous' | 'Temporary';
    if (updates.employment_status !== undefined) mappedUpdates.employmentStatus = updates.employment_status as 'Active' | 'Probationary' | 'Terminated' | 'Resigned' | 'On Leave' | 'Suspended' | 'Verbal Warning' | 'Written Warning' | 'Show Cause';
    if (updates.station !== undefined) mappedUpdates.station = String(updates.station);
    if (updates.office_address !== undefined) mappedUpdates.officeAddress = String(updates.office_address);
    if (updates.date_hired !== undefined) mappedUpdates.dateHired = String(updates.date_hired);
    if (updates.original_appointment_date !== undefined) mappedUpdates.originalAppointmentDate = String(updates.original_appointment_date);
    if (updates.last_promotion_date !== undefined) mappedUpdates.lastPromotionDate = String(updates.last_promotion_date);
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
        data: mapToAuthUser(user as UserData)
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
      data: mapToAuthUser(updatedUser as UserData)
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

export const getNextId = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.select({
      maxId: sql<number>`MAX(CAST(employee_id AS UNSIGNED))`
    })
    .from(authentication)
    .where(sql`employee_id REGEXP '^[0-9]+$'`);

    const nextId = (result[0]?.maxId || 0) + 1;
    res.status(200).json({
      success: true,
      data: String(nextId)
    });
  } catch (error) {
    console.error('Get Next ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch next ID' });
  }
};

export const findHiredApplicant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName } = req.query;

    if (!firstName || !lastName) {
      res.status(400).json({ success: false, message: 'First name and last name are required' });
      return;
    }

    // Only select registration-relevant fields — exclude interview notes, interviewer IDs, etc.
    const [applicant] = await db.select({
      id: recruitmentApplicants.id,
      first_name: recruitmentApplicants.first_name,
      last_name: recruitmentApplicants.last_name,
      middle_name: recruitmentApplicants.middle_name,
      suffix: recruitmentApplicants.suffix,
      email: recruitmentApplicants.email,
      phone_number: recruitmentApplicants.phone_number,
      photo_path: recruitmentApplicants.photo_path,
      birth_date: recruitmentApplicants.birth_date,
      birth_place: recruitmentApplicants.birth_place,
      sex: recruitmentApplicants.sex,
      civil_status: recruitmentApplicants.civil_status,
      height: recruitmentApplicants.height,
      weight: recruitmentApplicants.weight,
      blood_type: recruitmentApplicants.blood_type,
      gsis_no: recruitmentApplicants.gsis_no,
      pagibig_no: recruitmentApplicants.pagibig_no,
      philhealth_no: recruitmentApplicants.philhealth_no,
      umid_no: recruitmentApplicants.umid_no,
      philsys_id: recruitmentApplicants.philsys_id,
      tin_no: recruitmentApplicants.tin_no,
      address: recruitmentApplicants.address,
      zip_code: recruitmentApplicants.zip_code,
      permanent_address: recruitmentApplicants.permanent_address,
      permanent_zip_code: recruitmentApplicants.permanent_zip_code,
      is_meycauayan_resident: recruitmentApplicants.is_meycauayan_resident,
      education: recruitmentApplicants.education,
      experience: recruitmentApplicants.experience,
      skills: recruitmentApplicants.skills,
      hired_date: recruitmentApplicants.hired_date,
      eligibility: recruitmentApplicants.eligibility,
      eligibility_type: recruitmentApplicants.eligibility_type,
      eligibility_date: recruitmentApplicants.eligibility_date,
      eligibility_rating: recruitmentApplicants.eligibility_rating,
      eligibility_place: recruitmentApplicants.eligibility_place,
      license_no: recruitmentApplicants.license_no,
    })
    .from(recruitmentApplicants)
    .where(
      and(
        eq(recruitmentApplicants.first_name, String(firstName)),
        eq(recruitmentApplicants.last_name, String(lastName)),
        eq(recruitmentApplicants.stage, 'Hired')
      )
    )
    .limit(1);

    if (!applicant) {
      res.status(404).json({ success: false, message: 'No hired applicant found with this name' });
      return;
    }

    // Construct full photo URL for frontend display
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const photoUrl = applicant.photo_path
      ? `${backendUrl}/uploads/applications/${applicant.photo_path}`
      : null;

    res.status(200).json({
      success: true,
      data: {
        ...applicant,
        photo_url: photoUrl
      }
    });
  } catch (error) {
    console.error('Find Hired Applicant Error:', error);
    res.status(500).json({ success: false, message: 'Failed to search for applicant' });
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
