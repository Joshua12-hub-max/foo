import { Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import { authentication, bioEnrolledUsers, schedules, recruitmentApplicants, departments, plantillaPositions, recruitmentJobs, shiftTemplates, pdsHrDetails } from '../db/schema.js';
import { eq, or, and, sql, gt, getTableColumns, desc, InferSelectModel } from 'drizzle-orm';
import { AuthService } from '../services/auth.service.js';
import { checkSystemWideUniqueness } from '../services/validationService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import type { 
  AsyncHandler, 
  AuthenticatedHandler,
  AuthenticatedRequest,
  UserRole
} from '../types/index.js';
import { allocateDefaultCredits } from './leaveController.js';
import { 
  LoginSchema, 
  RegisterSchema, 
  VerifyOTPSchema, 
  EmailVerifySchema, 
  ResendOTPSchema, 
  ForgotPasswordSchema, 
  ResetPasswordSchema,
  GoogleLoginSchema,
  UpdateProfileSchema,
  SetupPortalSchema
} from '../schemas/authSchema.js';
import { sanitizeInput } from '../utils/spamUtils.js';

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

import { sendEmail, generateOTP, sendOTPEmail, maskEmail } from '../utils/emailUtils.js';

// Define the shape of the user object with relations as returned by findFirst/select
// Define the shape of the user object with relations as returned by findFirst/select
type UserWithRelations = InferSelectModel<typeof authentication> & {
  hrDetails?: {
    id: number;
    department?: { id: number; name: string } | null;
    position?: { positionTitle: string | null } | null;
    jobTitle: string | null;
    employmentStatus: string | null;
    appointmentType: string | null;
    dateHired: string | null;
    dutyType: string | null;
    profileStatus: string | null;
    isMeycauayan?: boolean | null;
  } | null;
  pdsEducations?: { schoolName: string | null }[] | null;
  duties?: string | null;
  shift?: string | null;
};

/**
 * Strictly maps an internal user/employee object to the Auth API response format.
 * Ensures consistency between /auth/me and /user/ profile data.
 */
const mapToAuthUser = (user: UserWithRelations) => {
  const parts: string[] = [];
  if (user.lastName) parts.push(`${user.lastName},`);
  if (user.firstName) parts.push(user.firstName);
  if (user.middleName && user.middleName.length > 0) parts.push(`${user.middleName.charAt(0)}.`);
  if (user.suffix) parts.push(user.suffix);

  const hr = user.hrDetails;
  const departmentName = hr?.department?.name || null;
  const jobTitle = hr?.position?.positionTitle || hr?.jobTitle || null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName,
    suffix: user.suffix,
    name: parts.join(' ').trim(),
    role: user.role,
    department: departmentName,
    departmentId: hr?.department?.id || null,
    employeeId: user.employeeId,
    avatarUrl: user.avatarUrl,
    jobTitle: jobTitle,
    employmentStatus: hr?.employmentStatus || 'Active',
    twoFactorEnabled: !!user.twoFactorEnabled,
    dateHired: hr?.dateHired || null,
    duties: user.duties || 'Standard Shift',
    shift: user.shift || '08:00 AM - 05:00 PM',
    dutyType: hr?.dutyType || 'Standard',
    appointmentType: hr?.appointmentType || 'Permanent',
    isVerified: user.isVerified ?? false,
    profileStatus: hr?.profileStatus || 'Initial',
    
    // Social Media / Other
    isMeycauayan: !!hr?.isMeycauayan,
  };
};


// ============================================================================
// Helper Functions
// ============================================================================

// Redundant functions removed — now using shared utils/emailUtils.js

// ============================================================================
// Auth Controllers
// ============================================================================

export const googleLogin: AsyncHandler = async (req, res) => {
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
        hrDetails: {
          with: {
            department: true
          }
        },
        schedules: {
          limit: 1,
          orderBy: [desc(schedules.updatedAt)],
          columns: { scheduleTitle: true }
        }
      }
    });

    if (!user) {
      res.status(403).json({
        success: false,
        message: 'Account not found. Please register manually via the Employee Portal.'
      });
      return;
    }

    // MANDATORY VERIFICATION CHECK
    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        message: "Please verify your email to access CHRMO Mey.",
        data: null
      });
      return;
    }

    // CHECK TERMINATION STATUS
    if (user.hrDetails?.employmentStatus === 'Terminated') {
      res.status(403).json({
        success: false,
        message: 'Access Denied: Your account has been terminated. Please contact Human Resource.',
        data: null
      });
      return;
    }

    // BIOMETRIC ENFORCEMENT: Check bio_enrolled_users (C# biometric data)
    const deptName = user.hrDetails?.department?.name || '';
      
    const isCHRMO = typeof deptName === 'string' && (
      deptName.toUpperCase().includes('CHRMO') || 
      deptName.toUpperCase().includes('HUMAN RESOURCE')
    );


    if (user.role !== 'Administrator' && user.role !== 'Human Resource') {
      // Format to match new Emp-XXX biometric ID format
      const rawId = user.employeeId || '0';
      const bioNumericId = parseInt(rawId.replace(/\D/g, ''), 10);
      const formattedBioId = `Emp-${String(bioNumericId).padStart(3, '0')}`;

      const [enrolled] = await db.select().from(bioEnrolledUsers).where(
        and(
          eq(bioEnrolledUsers.employeeId, formattedBioId),
          eq(bioEnrolledUsers.userStatus, 'active')
        )
      ).limit(1);

      if (!enrolled) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: You are not yet registered in the biometric system. Please contact your Human Resource or Administrator to complete your enrollment.',
          code: 'BIOMETRIC_NOT_ENROLLED'
        });
        return;
      }
    } else if (isCHRMO) {
      /* empty */

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
    } catch (_emailErr) {

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
  } catch (_error) {

    res.status(500).json({ message: 'Google authentication failed' });
  }
};

/**
 * GET /api/auth/verify-enrollment/:employeeId
 * PUBLIC endpoint — checks if employee is enrolled in biometrics.
 * Returns name + department from bio_enrolled_users.
 */
export const verifyEnrollment: AsyncHandler = async (req, res) => {
  try {
    const employeeId = String(req.params.employeeId);
    
    // Parse the input — accept "1", "001", or "EMP-001" / "Emp-001"
    let bioNumericId: number;
    const empMatch = employeeId.match(/Emp-(\d+)/i);
    if (empMatch) {
      bioNumericId = parseInt(empMatch[1], 10);
    } else {
      bioNumericId = parseInt(employeeId, 10);
    }

    if (isNaN(bioNumericId) || bioNumericId <= 0) {
      res.status(400).json({ success: false, message: 'Invalid Employee ID format.' });
      return;
    }

    const formattedBioId = `Emp-${String(bioNumericId).padStart(3, '0')}`;

    // Check bio_enrolled_users
    const [enrolled] = await db.select().from(bioEnrolledUsers).where(
      and(
        eq(bioEnrolledUsers.employeeId, formattedBioId),
        eq(bioEnrolledUsers.userStatus, 'active')
      )
    ).limit(1);

    if (!enrolled) {
      res.status(404).json({
        success: false,
        message: 'Employee ID not found in biometric enrollment. Please contact Human Resource to enroll first.',
        code: 'NOT_ENROLLED'
      });
      return;
    }

    // Convert to system ID format using the new Emp-XXX format
    const systemEmployeeId = formattedBioId;

    // Check if already registered in the web system
    const [existingAccount] = await db.select({ employeeId: authentication.employeeId })
      .from(authentication)
      .where(eq(authentication.employeeId, systemEmployeeId))
      .limit(1);

    res.status(200).json({
      success: true,
      message: 'Employee is enrolled in biometrics.',
      data: {
        bioEmployeeId: bioNumericId,
        systemEmployeeId,
        fullName: enrolled.fullName,
        department: enrolled.department,
        enrolledAt: enrolled.enrolledAt,
        alreadyRegistered: !!existingAccount
      }
    });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to verify enrollment.' });
  }
};

interface RegisterRequestWithFile extends Request {
  file?: Express.Multer.File;
}

export const register: AsyncHandler = async (req, res) => {
  const multerReq = req as unknown as RegisterRequestWithFile;
  try {
    const validatedData = RegisterSchema.parse(req.body);
    const { employeeId, email, password } = validatedData;
    const file = multerReq.file;
    const isFinalizingSetup = req.query.mode === 'finalize-setup';

    // 1. Parse bio ID from input
    let bioNumericId: number;
    if (typeof employeeId === 'number') {
        bioNumericId = employeeId;
    } else {
        const empMatch = String(employeeId || '').match(/Emp-(\d+)/i);
        bioNumericId = empMatch ? parseInt(empMatch[1], 10) : parseInt(String(employeeId || '0'), 10);
    }

    if (isNaN(bioNumericId) || bioNumericId <= 0) {
      res.status(400).json({ success: false, message: 'Invalid Employee ID format.', data: null });
      return;
    }

    const formattedBioId = `Emp-${String(bioNumericId).padStart(3, '0')}`;

    // 2. Verify biometric enrollment — MUST be enrolled to register
    const enrolled = await db.query.bioEnrolledUsers.findFirst({
      where: and(
        eq(bioEnrolledUsers.employeeId, formattedBioId),
        eq(bioEnrolledUsers.userStatus, 'active')
      )
    });

    if (!enrolled) {
      console.error(`[Register] Biometric record not found for ID: ${formattedBioId}`);
      res.status(403).json({
        success: false,
        message: `Biometric record not found for ID ${formattedBioId}. Please scan your fingerprint again.`,
        code: 'NOT_ENROLLED'
      });
      return;
    }

    // 3. Convert to system employee ID format
    const actualEmployeeId = formattedBioId;

    // 4. Use provided name if available, otherwise pull from bio_enrolled_users
    const firstName = sanitizeInput(validatedData.firstName || enrolled.fullName.split(' ')[0]);
    const lastName = sanitizeInput(validatedData.lastName || (enrolled.fullName.split(' ').length > 1 ? enrolled.fullName.split(' ').slice(1).join(' ') : ''));
    
    // 5. Check System-Wide Uniqueness
    const uniqueErrors = await checkSystemWideUniqueness({
        email,
        umidNumber: validatedData.umidNumber,
        philsysId: validatedData.philsysId,
        philhealthNumber: validatedData.philhealthNumber,
        pagibigNumber: validatedData.pagibigNumber,
        tinNumber: validatedData.tinNumber,
        gsisNumber: validatedData.gsisNumber
    });

    if (Object.keys(uniqueErrors).length > 0) {
        res.status(409).json({ 
            success: false, 
            message: 'Uniqueness validation failed.', 
            errors: Object.values(uniqueErrors) 
        });
        return;
    }

    const existingUser = await db.query.authentication.findFirst({
      where: or(
        eq(authentication.employeeId, actualEmployeeId),
        eq(authentication.email, email)
      ),
      with: {
        hrDetails: true
      }
    });

    // Auto-detect finalize mode if the matched user is still in 'Initial' setup state
    // This makes the system resilient if the frontend loses the ?mode=finalize-setup query param
    const effectiveFinalizingSetup = isFinalizingSetup || (existingUser?.hrDetails?.profileStatus === 'Initial');

    if (existingUser) {
      if (!effectiveFinalizingSetup) {
        if (existingUser.email === email) {
          res.status(409).json({ success: false, message: 'Email already exists.', data: null });
          return;
        }
        res.status(409).json({ success: false, message: 'This Employee ID is already registered.', data: null });
        return;
      }
    }

    // New: Homonym (Duplicate Name) Detection
    if (!validatedData.ignoreDuplicateWarning) {
        const nameMatch = await db.query.authentication.findFirst({
            where: and(
                eq(authentication.firstName, firstName),
                eq(authentication.lastName, lastName),
                effectiveFinalizingSetup && existingUser ? sql`${authentication.id} != ${existingUser.id}` : sql`TRUE`
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
    let avatarUrl: string | null = existingUser?.avatarUrl || null;
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
        } catch (_copyErr) {
            // Silently fail if photo copy fails
        }
    }

    // 7. Hash password ONLY IF PROVIDED (allows keeping old password in setup mode)
    // CRITICAL FIX: Robust protection against browser auto-fill and visual dummy strings
    let hashedPassword = existingUser?.passwordHash || '';
    
    const isDummyPassword = password === "********" || password === "••••••••";
    const shouldUpdatePassword = password && !isDummyPassword && password.length >= 8;

    if (shouldUpdatePassword) {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
    } else if (!effectiveFinalizingSetup && !existingUser) {
        // This is a new user and no valid password was provided (should have been caught by Zod but adding safety)
        res.status(400).json({ success: false, message: 'A valid password is required for new accounts.' });
        return;
    }

    // 8. Generate Verification OTP
    const verificationOTP = generateOTP();

    // 9. Determine Portal Role & Parse Position
    let assignedRole: UserRole = 'Employee';
    const rawPos = validatedData.position || '';
    
    const posMatch = rawPos.match(/^(.*)\s\((.*)\)$/);
    const positionTitle = posMatch ? posMatch[1].trim() : rawPos;
    const itemNumber = posMatch ? posMatch[2].trim() : null;

    const posTitleLower: string = positionTitle.toLowerCase();
    const department = validatedData.department || enrolled.department || 'Unassigned';
    const deptLower: string = (department || '').toLowerCase();

    if (deptLower.includes('human resource') && posTitleLower.includes('department head')) {
        assignedRole = 'Human Resource';
    } else if (posTitleLower.includes('administrative officer')) {
        assignedRole = 'Administrator';
    }

    // Resolve IDs
    let departmentId: number | null = null;
    if (department && department !== 'Unassigned') {
      const existingDept = await db.query.departments.findFirst({
        where: eq(departments.name, department)
      });
      if (existingDept) {
        departmentId = existingDept.id;
      }
    }

    let positionId: number | null = null;
    if (itemNumber) {
      const pos = await db.query.plantillaPositions.findFirst({
        where: eq(plantillaPositions.itemNumber, itemNumber)
      });
      if (pos) {
        positionId = pos.id;
      }
    }

    // Fallback for departmentId preservation in finalize-setup
    if (effectiveFinalizingSetup && !departmentId && existingUser?.hrDetails?.departmentId) {
        departmentId = existingUser.hrDetails.departmentId;
    }

    const authDataValues: typeof authentication.$inferInsert = {
      firstName,
      lastName,
      middleName: validatedData.middleName ? sanitizeInput(validatedData.middleName) : undefined,
      suffix: validatedData.suffix ? sanitizeInput(validatedData.suffix) : undefined,
      email,
      role: assignedRole,
      employeeId: actualEmployeeId,
      passwordHash: hashedPassword,
      isVerified: false, 
      verificationToken: verificationOTP,
      avatarUrl,
    };

    let newUserId: number = 0;

    await db.transaction(async (tx) => {
      if (effectiveFinalizingSetup && existingUser) {
        // UPDATE EXISTING ADMIN/HR
        await tx.update(authentication).set(authDataValues).where(eq(authentication.id, existingUser.id));
        newUserId = existingUser.id;

        // Upsert HR Details
        const hrValues = {
          employeeId: newUserId,
          jobTitle: positionTitle,
          positionTitle: positionTitle,
          itemNumber: itemNumber,
          departmentId: departmentId || existingUser.hrDetails?.departmentId || null,
          dateHired: validatedData.applicantHiredDate || existingUser.hrDetails?.dateHired || new Date().toISOString().split('T')[0],
          dutyType: (validatedData.dutyType === 'Irregular' ? 'Irregular' : 'Standard') as 'Standard' | 'Irregular',
          appointmentType: (validatedData.appointmentType || existingUser.hrDetails?.appointmentType || 'Permanent') as 'Permanent' | 'Contractual' | 'Casual' | 'Job Order' | 'Coterminous' | 'Temporary' | 'Contract of Service' | 'JO' | 'COS',
          profileStatus: 'Complete' as const,
          employmentStatus: 'Active' as const,
          isOldEmployee: validatedData.isOldEmployee || existingUser.hrDetails?.isOldEmployee || false,
          isMeycauayan: (validatedData.isMeycauayan === true),
          facebookUrl: validatedData.facebookUrl || existingUser.hrDetails?.facebookUrl || undefined,
          linkedinUrl: validatedData.linkedinUrl || existingUser.hrDetails?.linkedinUrl || undefined,
          twitterHandle: validatedData.twitterHandle || existingUser.hrDetails?.twitterHandle || undefined,
        };

        const existingHr = await tx.query.pdsHrDetails.findFirst({
          where: eq(pdsHrDetails.employeeId, newUserId)
        });

        if (existingHr) {
          await tx.update(pdsHrDetails).set(hrValues).where(eq(pdsHrDetails.employeeId, newUserId));
        } else {
          await tx.insert(pdsHrDetails).values(hrValues);
        }

        // Allocate default credits and schedules for the finalized admin
        await allocateDefaultCredits(actualEmployeeId);
      } else {
        // INSERT NEW USER
        const [insertResult] = await tx.insert(authentication).values(authDataValues);
        newUserId = insertResult.insertId;

        // Insert HR Details
        await tx.insert(pdsHrDetails).values({
          employeeId: newUserId,
          jobTitle: positionTitle,
          positionTitle: positionTitle,
          itemNumber: itemNumber,
          departmentId,
          dateHired: validatedData.applicantHiredDate || new Date().toISOString().split('T')[0],
          dutyType: (validatedData.dutyType === 'Irregular' ? 'Irregular' : 'Standard') as 'Standard' | 'Irregular',
          appointmentType: (validatedData.appointmentType || 'Permanent') as 'Permanent' | 'Contractual' | 'Casual' | 'Job Order' | 'Coterminous' | 'Temporary' | 'Contract of Service' | 'JO' | 'COS',
          profileStatus: 'Complete' as const,
          employmentStatus: 'Active' as const,
          isOldEmployee: validatedData.isOldEmployee || false,
          isMeycauayan: (validatedData.isMeycauayan === true),
          facebookUrl: validatedData.facebookUrl || undefined,
          linkedinUrl: validatedData.linkedinUrl || undefined,
          twitterHandle: validatedData.twitterHandle || undefined,
        });
        
        // Initial leave allocation for brand new users
        await allocateDefaultCredits(actualEmployeeId);
      }

      // Allocate Standard Schedule for all newly registered or finalized users
      const startDate = validatedData.applicantHiredDate || new Date().toISOString().split('T')[0];
      
      // FETCH THE SYSTEM DEFAULT SHIFT TEMPLATE (Dynamic Solution)
      const [defaultShift] = await tx.select()
        .from(shiftTemplates)
        .where(eq(shiftTemplates.isDefault, true))
        .limit(1);

      let workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      let startTime = '08:00:00';
      let endTime = '17:00:00';
      let scheduleTitle = 'Standard Shift';

      if (defaultShift) {
        startTime = defaultShift.startTime;
        endTime = defaultShift.endTime;
        scheduleTitle = defaultShift.name;
        if (defaultShift.workingDays) {
          workDays = defaultShift.workingDays.split(',').map(d => d.trim());
        }
      }

      const scheduleValues = workDays.map(day => ({
        employeeId: actualEmployeeId,
        scheduleTitle: scheduleTitle,
        dayOfWeek: day,
        startTime: startTime,
        endTime: endTime,
        startDate: startDate,
        repeatPattern: 'Weekly',
        isRestDay: false
      }));

      if (scheduleValues.length > 0) {
        await tx.insert(schedules).values(scheduleValues);
      }

      // Update position status if linked
      if (positionId) {
        await tx.update(plantillaPositions)
          .set({ 
            isVacant: false, 
            incumbentId: newUserId,
            filledDate: new Date().toISOString().split('T')[0]
          })
          .where(eq(plantillaPositions.id, positionId));
      }
    });

    // 11. Send Verification Email (SKIP IF ALREADY VERIFIED, e.g. Admin/HR who verified after setup-portal)
    if (!authDataValues.isVerified) {
        try {
          if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('Email credentials are not configured.');
          }
          await sendOTPEmail(email, firstName, verificationOTP, 'Email Verification', 'Thank you for registering. Please use the code below to verify your email address:');
        } catch (_emailErr) {
          // Log but don't fail registration
          console.error('[REGISTER] Email send failed:', _emailErr instanceof Error ? _emailErr.message : _emailErr);
        }
    }

    // Link recruitment record if this was a pre-filled registration
    if (validatedData.applicantId) {
        try {
            await db.update(recruitmentApplicants)
                .set({
                    isRegistered: true,
                    registeredEmployeeId: actualEmployeeId
                })
                .where(eq(recruitmentApplicants.id, validatedData.applicantId));
        } catch (_linkErr) {
            // Silently fail link update
        }
    }

    res.status(effectiveFinalizingSetup ? 200 : 201).json({
      success: true,
      message: effectiveFinalizingSetup 
        ? 'Registration completed successfully! Your profile has been updated permanently.' 
        : 'Registration successful! Please check your email for the verification code.',
      data: { 
        email, 
        id: newUserId,
        employeeId: actualEmployeeId, 
        fullName: `${firstName} ${lastName}`, 
        department,
        requiresVerification: true,
        message: 'Registration successful! Please check your email for the 6-digit verification code.'
      }
    });
  } catch (err: unknown) {
    console.error('[REGISTER ERROR] Registration failed with details:', err instanceof Error ? err.stack : err);
    if (err instanceof z.ZodError) {
      console.error('[REGISTER ERROR] Zod validation failed:', JSON.stringify(err.issues, null, 2));
      res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: err.issues
      });
      return;
    }

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

    await db.update(authentication)
      .set({ isVerified: true, verificationToken: null })
      .where(eq(authentication.id, user.id));

    res.status(200).json({ 
      success: true, 
      message: 'Email verified successfully. You can now access your portal.',
      data: {
        id: user.id,
        employeeId: user.employeeId,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (_err: unknown) {

    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const resendVerificationEmail: AsyncHandler = async (req, res) => {
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
  } catch (_error: unknown) {

    res.status(500).json({ success: false, message: 'Failed to resend verification code.' });
  }
};

export const forgotPassword: AsyncHandler = async (req, res) => {
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
      .set({ 
        resetPasswordToken: resetToken, 
        resetPasswordExpires: resetExpires.toISOString() 
      })
      .where(eq(authentication.id, user.id));

    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h1 style="color: #333; text-align: center;">Password Reset Request</h1>
        <p>Hi ${user.firstName},</p>
        <p>You requested a password reset for your NEBR account. Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888;">NEBR - Integrated Management System</p>
      </div>
    `;

    await sendEmail(email, 'Password Reset Request - NEBR', htmlContent);
    res.status(200).json({ success: true, message: 'Password reset email sent.' });
  } catch (err: unknown) {
    console.error('[FORGOT PASSWORD ERROR]', err);
    res.status(500).json({ success: false, message: 'Failed to send password reset email.' });
  }
};

export const resetPassword: AsyncHandler = async (req, res) => {
  try {
    const { token, newPassword } = ResetPasswordSchema.parse(req.body);
    const user = await db.query.authentication.findFirst({
      where: and(
        eq(authentication.resetPasswordToken, token),
        gt(authentication.resetPasswordExpires, new Date().toISOString())
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
  } catch (err: unknown) {
    console.error('[RESET PASSWORD ERROR]', err);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

export const getMe: AuthenticatedHandler = async (req, res) => {
  try {
    const userId = req.user.id;

    const [userData] = await db.select({
      ...getTableColumns(authentication),
      duties: sql<string>`COALESCE(
        (SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
        (SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
        (SELECT name FROM shift_templates WHERE is_default = 1 LIMIT 1),
        'Standard Shift'
      )`,
      shift: sql<string>`COALESCE(
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM shift_templates WHERE is_default = 1 LIMIT 1),
        '08:00 AM - 05:00 PM'
      )`
    })
    .from(authentication)
    .where(eq(authentication.id, userId));

    if (!userData) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const userWithHr = await db.query.authentication.findFirst({
        where: eq(authentication.id, userId),
        with: {
            hrDetails: {
                with: {
                    department: true,
                    position: true
                }
            }
        }
    });

    res.status(200).json({
      success: true,
      data: {
        user: mapToAuthUser({
            ...userData,
            hrDetails: userWithHr?.hrDetails
        } as UserWithRelations)
      }
    });
  } catch (_error: unknown) {

    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const login: AsyncHandler = async (req, res) => {
  try {
    const { identifier, password } = LoginSchema.parse(req.body);
    
    let user;
    try {
        user = await AuthService.findUserByIdentifier(identifier);
    } catch (dbErr: unknown) {
        console.error(`[LOGIN ERROR] AuthService.findUserByIdentifier failed!`);
        if (dbErr instanceof Error) {
            console.error(`[LOGIN ERROR] Message: ${dbErr.message}`);
        }
        // if (dbErr.sql) console.error(`[LOGIN ERROR] SQL: ${dbErr.sql}`); // Cannot easily access .sql on unknown
        throw dbErr; // Rethrow to be caught by the main catch block
    }
    
    if (!user) {

      res.status(401).json({ success: false, message: 'Invalid Credentials' });
      return;
    }

    if (!user.isVerified) {

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

            res.status(403).json({ 
                success: false, 
                message: `Account is temporarily locked due to multiple failed attempts. Please try again in ${minutesLeft} minutes.`,
                code: 'ACCOUNT_LOCKED'
            });
            return;
        }
    }

    // CHECK TERMINATION STATUS
    if (user.hrDetails?.employmentStatus === 'Terminated') {

      res.status(403).json({
        success: false,
        message: 'access denied: your account has been terminated. please contact human resource.',
        data: null
      });
      return;
    }

    // BIOMETRIC ENFORCEMENT: Check bio_enrolled_users (C# biometric data)
    const deptName = user.hrDetails?.department?.name || '';
      
    const isCHRMO = typeof deptName === 'string' && (
      deptName.toUpperCase().includes('CHRMO') || 
      deptName.toUpperCase().includes('HUMAN RESOURCE')
    );

    if (user.role !== 'Administrator' && user.role !== 'Human Resource') {
      // Format to match new Emp-XXX biometric ID format
      const rawId = user.employeeId || '0';
      const bioNumericId = parseInt(rawId.replace(/\D/g, ''), 10);
      const formattedBioId = `Emp-${String(bioNumericId).padStart(3, '0')}`;

      const [enrolled] = await db.select().from(bioEnrolledUsers).where(
        and(
          eq(bioEnrolledUsers.employeeId, formattedBioId),
          eq(bioEnrolledUsers.userStatus, 'active')
        )
      ).limit(1);

      if (!enrolled) {

        res.status(403).json({
          success: false,
          message: 'access denied: you are not yet registered in the biometric system. please contact your human resource administrator to complete your enrollment.',
          code: 'BIOMETRIC_NOT_ENROLLED',
          data: null
        });
        return;
      }

    }
 else if (isCHRMO) {
      /* empty */

    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash || '');
    console.warn(`[LOGIN DEBUG] Password match result: ${passwordMatch}`);
    if (!passwordMatch) {
      console.warn(`[LOGIN DEBUG] Input password: "${password}"`);
      console.warn(`[LOGIN DEBUG] Hash in DB: "${user.passwordHash}"`);

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
          } catch (_e) {
      /* empty */

          }
      }

      const message = newAttempts >= 5 
        ? 'too many failed attempts. your account has been locked for 30 minutes.'
        : `invalid credentials. ${5 - newAttempts} attempts remaining before account lock.`;

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

      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      await db.update(authentication)
        .set({ twoFactorOtp: otp, twoFactorOtpExpires: otpExpires.toISOString() })
        .where(eq(authentication.id, user.id));

      try {
        await sendOTPEmail(user.email, user.firstName, otp, 'Your Login OTP', 'Your One-Time Password (OTP) for login is:');
      } catch (_emailErr) {

        res.status(500).json({ success: false, message: 'Failed to send 2FA code.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: '2fa verification required',
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
    let duties = 'Standard Shift';
    let shift = '08:00 AM - 05:00 PM';
    try {
      const [userSchedule] = await db.select({
        duties: sql<string>`COALESCE(
          (SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
          (SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
          (SELECT name FROM shift_templates WHERE is_default = 1 LIMIT 1),
          'Standard Shift'
        )`,
        shift: sql<string>`COALESCE(
          (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
          (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
          (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM shift_templates WHERE is_default = 1 LIMIT 1),
          '08:00 AM - 05:00 PM'
        )`
      }).from(authentication).where(eq(authentication.id, user.id));
      duties = userSchedule?.duties || 'Standard Shift';
      shift = userSchedule?.shift || '08:00 AM - 05:00 PM';
    } catch (schedErr: unknown) {
      const msg = schedErr instanceof Error ? schedErr.message : String(schedErr);
      console.error('[LOGIN] Schedule fetch failed:', msg);
    }

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        user: mapToAuthUser({
          ...user,
          duties,
          shift
        })
      }
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[LOGIN ERROR]', msg);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during login.',
      data: null
    });
  }
};

export const verifyTwoFactorOTP: AsyncHandler = async (req, res) => {
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
      res.status(400).json({ success: false, message: 'no otp request found. please login again.' });
      return;
    }

    if (new Date() > new Date(user.twoFactorOtpExpires)) {
      res.status(400).json({ success: false, message: 'otp has expired. please login again.' });
      return;
    }

    if (user.twoFactorOtp !== otp) {
      res.status(400).json({ success: false, message: 'invalid otp.' });
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
        department: (user as any).hrDetails?.department?.name || null,
        employeeId: user.employeeId
      }
    });
  } catch (_err) {

    res.status(500).json({ success: false, message: 'Verification failed.' });
  }
};

export const enableTwoFactor: AuthenticatedHandler = async (req, res) => {
  const authReq = req;
  const userId = authReq.user.id;

  try {
    await db.update(authentication)
      .set({ twoFactorEnabled: true })
      .where(eq(authentication.id, userId));
    res.status(200).json({ success: true, message: 'Two-factor authentication enabled.' });
  } catch (_err) {

    res.status(500).json({ success: false, message: 'Failed to enable 2FA.' });
  }
};

export const disableTwoFactor: AuthenticatedHandler = async (req, res) => {
  const authReq = req;
  const userId = authReq.user.id;

  try {
    await db.update(authentication)
      .set({ twoFactorEnabled: false })
      .where(eq(authentication.id, userId));
    res.status(200).json({ success: true, message: 'Two-factor authentication disabled.' });
  } catch (_err) {

    res.status(500).json({ success: false, message: 'Failed to disable 2FA.' });
  }
};

export const resendTwoFactorOTP: AsyncHandler = async (req, res) => {
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
  } catch (_err) {

    res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
  }
};

export const getUsers: AsyncHandler = async (_req, res) => {
  try {
    const users = await db.select({
      id: authentication.id,
      employeeId: authentication.employeeId,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      email: authentication.email,
      department: departments.name,
      positionTitle: pdsHrDetails.positionTitle,
      jobTitle: pdsHrDetails.jobTitle,
      employmentStatus: pdsHrDetails.employmentStatus,
      role: authentication.role,
      avatarUrl: authentication.avatarUrl,
      twoFactorEnabled: authentication.twoFactorEnabled,
      duties: sql<string>`COALESCE(
        (SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
        (SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
        (SELECT name FROM shift_templates WHERE is_default = 1 LIMIT 1),
        'Standard Shift'
      )`,
      shift: sql<string>`COALESCE(
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM shift_templates WHERE is_default = 1 LIMIT 1),
        '08:00 AM - 05:00 PM'
      )`
    })
    .from(authentication)
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .orderBy(authentication.lastName);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully.',
      data: users
    });
  } catch (_err) {

    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred while fetching users.',
      data: null
    });
  }
};

export const getUserById: AsyncHandler = async (req, res) => {
  const { id } = req.params;

  try {
    const [user] = await db.select({
      ...getTableColumns(authentication),
      department: departments.name,
      positionTitle: pdsHrDetails.positionTitle,
      jobTitle: pdsHrDetails.jobTitle,
      employmentStatus: pdsHrDetails.employmentStatus,
      itemNumber: pdsHrDetails.itemNumber,
      salaryGrade: pdsHrDetails.salaryGrade,
      stepIncrement: pdsHrDetails.stepIncrement,
      appointmentType: pdsHrDetails.appointmentType,
      station: pdsHrDetails.station,
      officeAddress: pdsHrDetails.officeAddress,
      dateHired: pdsHrDetails.dateHired,
      originalAppointmentDate: pdsHrDetails.originalAppointmentDate,
      lastPromotionDate: pdsHrDetails.lastPromotionDate,
      managerId: pdsHrDetails.managerId,
      duties: sql<string>`COALESCE(
        (SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
        (SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
        (SELECT name FROM shift_templates WHERE is_default = 1 LIMIT 1),
        'Standard Shift'
      )`,
      shift: sql<string>`COALESCE(
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM shift_templates WHERE is_default = 1 LIMIT 1),
        '08:00 AM - 05:00 PM'
      )`
    })
    .from(authentication)
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .where(eq(authentication.id, Number(id)));

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Fetch Manager Name if managerId exists
    let managerName: string | null = null;
    if (user.managerId) {
      const manager = await db.query.authentication.findFirst({
        where: eq(authentication.id, user.managerId)
      });
      if (manager) {
        managerName = `${manager.firstName} ${manager.lastName}`;
      }
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully.',
      data: {
        ...user,
        managerName
      }
    });
  } catch (_err) {

    res.status(500).json({ success: false, message: 'Failed to fetch user details' });
  }
};

interface UpdateProfileRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}

export const updateProfile: AuthenticatedHandler = async (req, res) => {
  const profileReq = req as unknown as UpdateProfileRequest;
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const targetUserId = Number(req.params.id) || userId;

    if (targetUserId !== userId && userRole !== 'Administrator' && userRole !== 'Human Resource') {
      res.status(403).json({ success: false, message: 'Forbidden: You cannot update another user\'s profile.' });
      return;
    }
    
    // Safe Parse Body
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid update data', errors: parsed.error.format() });
      return;
    }
    const updates = parsed.data;
    const file = profileReq.file;

    let avatarUrl: string | undefined;
    if (file) {
      avatarUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/avatars/${file.filename}`;
    }

    // Fetch target user to compare email
    const targetUser = await db.query.authentication.findFirst({
      where: eq(authentication.id, targetUserId),
      columns: { email: true, id: true, role: true, firstName: true }
    });

    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Check System-Wide Uniqueness
    const uniqueErrors = await checkSystemWideUniqueness({
        email: updates.email && updates.email !== targetUser.email ? updates.email : undefined,
        umidNumber: updates.umidNumber,
        philsysId: updates.philsysId,
        philhealthNumber: updates.philhealthNumber,
        pagibigNumber: updates.pagibigNumber,
        tinNumber: updates.tinNumber,
        gsisNumber: updates.gsisNumber,
        excludeAuthId: targetUserId
    });

    if (Object.keys(uniqueErrors).length > 0) {
        res.status(409).json({ success: false, message: 'Uniqueness validation failed.', errors: uniqueErrors });
        return;
    }

    const mappedAuthUpdates: Partial<typeof authentication.$inferInsert> = {};
    const mappedHrUpdates: Partial<typeof pdsHrDetails.$inferInsert> = {};

    if (updates.firstName) mappedAuthUpdates.firstName = String(updates.firstName);
    if (updates.lastName) mappedAuthUpdates.lastName = String(updates.lastName);
    if (updates.middleName) mappedAuthUpdates.middleName = String(updates.middleName);
    if (updates.suffix !== undefined) mappedAuthUpdates.suffix = String(updates.suffix);
    
    // Only reset verification if email CHANGED
    if (updates.email && updates.email !== targetUser.email) {
      mappedAuthUpdates.email = String(updates.email);
      
      const isEmployee = targetUser.role !== 'Administrator' && targetUser.role !== 'Human Resource';
      
      const verificationOTP = generateOTP();
      mappedAuthUpdates.isVerified = false;
      mappedAuthUpdates.verificationToken = verificationOTP;
      
      try {
          await sendOTPEmail(
              String(updates.email), 
              targetUser.firstName || 'User', 
              verificationOTP, 
              isEmployee ? 'Email Change Verification' : 'Security Alert: Your email address has been changed', 
              isEmployee 
                ? 'You have updated your email address. Please use the code below to verify your new email:'
                : 'Security Alert: Your email address has been changed. Please verify to maintain access:'
          );
      } catch (_e) {
          /* empty */
      }
    }

    if (updates.facebookUrl !== undefined) mappedHrUpdates.facebookUrl = String(updates.facebookUrl);
    if (updates.linkedinUrl !== undefined) mappedHrUpdates.linkedinUrl = String(updates.linkedinUrl);
    if (updates.twitterHandle !== undefined) mappedHrUpdates.twitterHandle = String(updates.twitterHandle);
    if (updates.isMeycauayan !== undefined) mappedHrUpdates.isMeycauayan = !!updates.isMeycauayan;
    
    if (updates.positionTitle !== undefined) {
        mappedHrUpdates.positionTitle = String(updates.positionTitle);
        mappedHrUpdates.jobTitle = String(updates.positionTitle);
    }
    if (updates.itemNumber !== undefined) mappedHrUpdates.itemNumber = String(updates.itemNumber);
    if (updates.salaryGrade !== undefined) mappedHrUpdates.salaryGrade = String(updates.salaryGrade);
    if (updates.stepIncrement !== undefined) mappedHrUpdates.stepIncrement = Number(updates.stepIncrement);
    if (updates.appointmentType !== undefined) mappedHrUpdates.appointmentType = updates.appointmentType;
    if (updates.employmentStatus !== undefined) mappedHrUpdates.employmentStatus = updates.employmentStatus;
    if (updates.station !== undefined) mappedHrUpdates.station = String(updates.station);
    if (updates.officeAddress !== undefined) mappedHrUpdates.officeAddress = String(updates.officeAddress);
    if (updates.dateHired !== undefined) mappedHrUpdates.dateHired = String(updates.dateHired);
    if (updates.originalAppointmentDate !== undefined) mappedHrUpdates.originalAppointmentDate = String(updates.originalAppointmentDate);
    if (updates.lastPromotionDate !== undefined) mappedHrUpdates.lastPromotionDate = String(updates.lastPromotionDate);

    if (avatarUrl) mappedAuthUpdates.avatarUrl = avatarUrl;

    if (Object.keys(mappedAuthUpdates).length === 0 && Object.keys(mappedHrUpdates).length === 0) {
      // If no changes, still return success to avoid frontend error states
      // but fetch the target user to return their data
      const [user] = await db.select({
        ...getTableColumns(authentication),
        department: departments.name,
        positionTitle: pdsHrDetails.positionTitle,
        jobTitle: pdsHrDetails.jobTitle,
        employmentStatus: pdsHrDetails.employmentStatus,
        duties: sql<string>`COALESCE(
          (SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
          (SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
          (SELECT name FROM shift_templates WHERE is_default = 1 LIMIT 1),
          'Standard Shift'
        )`,
        shift: sql<string>`COALESCE(
          (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
          (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
          (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM shift_templates WHERE is_default = 1 LIMIT 1),
          '08:00 AM - 05:00 PM'
        )`
      })
      .from(authentication)
      .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
      .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
      .where(eq(authentication.id, targetUserId));

      res.json({
        success: true,
        message: 'No changes detected',
        data: mapToAuthUser(user as UserWithRelations)
      });
      return;
    }

    await db.transaction(async (tx) => {
        if (Object.keys(mappedAuthUpdates).length > 0) {
            await tx.update(authentication)
                .set(mappedAuthUpdates)
                .where(eq(authentication.id, targetUserId));
        }

        if (Object.keys(mappedHrUpdates).length > 0) {
            const existingHr = await tx.query.pdsHrDetails.findFirst({
                where: eq(pdsHrDetails.employeeId, targetUserId)
            });

            if (existingHr) {
                await tx.update(pdsHrDetails)
                    .set(mappedHrUpdates)
                    .where(eq(pdsHrDetails.employeeId, targetUserId));
            } else {
                await tx.insert(pdsHrDetails)
                    .values({ ...mappedHrUpdates, employeeId: targetUserId });
            }
        }
    });

    // Fetch updated user with duties
    const [updatedUser] = await db.select({
      ...getTableColumns(authentication),
      duties: sql<string>`COALESCE(
        (SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
        (SELECT schedule_title FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
        (SELECT name FROM shift_templates WHERE is_default = 1 LIMIT 1),
        'Standard Shift'
      )`,
      shift: sql<string>`COALESCE(
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) AND (end_date IS NULL OR end_date >= CURDATE()) ORDER BY updated_at DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM schedules WHERE employee_id = ${authentication.employeeId} AND (start_date IS NULL OR start_date <= CURDATE()) ORDER BY start_date DESC LIMIT 1),
        (SELECT CONCAT(TIME_FORMAT(start_time, '%h:%i %p'), ' - ', TIME_FORMAT(end_time, '%h:%i %p')) FROM shift_templates WHERE is_default = 1 LIMIT 1),
        '08:00 AM - 05:00 PM'
      )`
    })
    .from(authentication)
    .where(eq(authentication.id, targetUserId));

    const userWithHr = await db.query.authentication.findFirst({
        where: eq(authentication.id, targetUserId),
        with: {
            hrDetails: {
                with: {
                    department: true,
                    position: true
                }
            }
        }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: mapToAuthUser({
        ...updatedUser,
        hrDetails: userWithHr?.hrDetails
      } as UserWithRelations)
    });
  } catch (_error: unknown) {

    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

export const getNextId: AsyncHandler = async (_req, res) => {
  try {
    const [result] = await db.select({
      maxId: sql<number | null>`MAX(CAST(SUBSTRING(${authentication.employeeId}, 5) AS UNSIGNED))`
    })
    .from(authentication)
    .where(sql`${authentication.employeeId} LIKE 'Emp-%'`);

    const maxId = result?.maxId || 0;
    const nextId = maxId + 1;
    const formattedNextId = `Emp-${String(nextId).padStart(3, '0')}`;

    res.status(200).json({
      success: true,
      data: formattedNextId
    });
  } catch (_error: unknown) {
    res.status(500).json({ success: false, message: 'Failed to fetch next ID' });
  }
};

export const findHiredApplicant: AsyncHandler = async (req, res) => {
  try {
    const firstNameParam = req.query.firstName;
    const lastNameParam = req.query.lastName;
    const firstName = typeof firstNameParam === 'string' ? firstNameParam : '';
    const lastName = typeof lastNameParam === 'string' ? lastNameParam : '';


    if (!firstName || !lastName) {
      res.status(400).json({ success: false, message: 'First name and last name are required' });
      return;
    }

    // Only select registration-relevant fields — exclude interview notes, interviewer IDs, etc.
    const [applicant] = await db.select({
      id: recruitmentApplicants.id,
      firstName: recruitmentApplicants.firstName,
      lastName: recruitmentApplicants.lastName,
      middleName: recruitmentApplicants.middleName,
      suffix: recruitmentApplicants.suffix,
      email: recruitmentApplicants.email,
      phoneNumber: recruitmentApplicants.phoneNumber,
      photoPath: recruitmentApplicants.photoPath,
      birthDate: recruitmentApplicants.birthDate,
      birthPlace: recruitmentApplicants.birthPlace,
      sex: recruitmentApplicants.sex,
      civilStatus: recruitmentApplicants.civilStatus,
      height: recruitmentApplicants.height,
      weight: recruitmentApplicants.weight,
      bloodType: recruitmentApplicants.bloodType,
      gsisNumber: recruitmentApplicants.gsisNumber,
      pagibigNumber: recruitmentApplicants.pagibigNumber,
      philhealthNumber: recruitmentApplicants.philhealthNumber,
      umidNumber: recruitmentApplicants.umidNumber,
      philsysId: recruitmentApplicants.philsysId,
      tinNumber: recruitmentApplicants.tinNumber,
      address: recruitmentApplicants.address,
      zipCode: recruitmentApplicants.zipCode,
      permanentAddress: recruitmentApplicants.permanentAddress,
      permanentZipCode: recruitmentApplicants.permanentZipCode,
      isMeycauayanResident: recruitmentApplicants.isMeycauayanResident,
      educationalBackground: recruitmentApplicants.educationalBackground,
      schoolName: recruitmentApplicants.schoolName,
      course: recruitmentApplicants.course,
      yearGraduated: recruitmentApplicants.yearGraduated,
      experience: recruitmentApplicants.experience,
      skills: recruitmentApplicants.skills,
      emergencyContact: recruitmentApplicants.emergencyContact,
      emergencyContactNumber: recruitmentApplicants.emergencyContactNumber,
      hiredDate: recruitmentApplicants.hiredDate,
      eligibility: recruitmentApplicants.eligibility,
      eligibilityType: recruitmentApplicants.eligibilityType,
      eligibilityDate: recruitmentApplicants.eligibilityDate,
      eligibilityRating: recruitmentApplicants.eligibilityRating,
      eligibilityPlace: recruitmentApplicants.eligibilityPlace,
      licenseNo: recruitmentApplicants.licenseNo,
      totalExperienceYears: recruitmentApplicants.totalExperienceYears,
      jobTitle: recruitmentJobs.title,
      department: recruitmentJobs.department,
      employmentType: recruitmentJobs.employmentType,
      dutyType: recruitmentJobs.dutyType,
    })
    .from(recruitmentApplicants)
    .leftJoin(recruitmentJobs, eq(recruitmentApplicants.jobId, recruitmentJobs.id))
    .where(
      and(
        eq(recruitmentApplicants.firstName, String(firstName)),
        eq(recruitmentApplicants.lastName, String(lastName)),
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
    const photoUrl = applicant.photoPath
      ? `${backendUrl}/uploads/applications/${applicant.photoPath}`
      : null;

    res.status(200).json({
      success: true,
      data: {
        ...applicant,
        photoUrl: photoUrl
      }
    });
  } catch (_error: unknown) {

    res.status(500).json({ success: false, message: 'Failed to search for applicant' });
  }
};

export const checkEmailUniqueness: AsyncHandler = async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.query);
    
    const errors = await checkSystemWideUniqueness({ email });
    
    if (errors.email) {
      res.status(409).json({ 
        success: false, 
        message: errors.email,
        isUnique: false 
      });
      return;
    }

    res.status(200).json({ 
      success: true, 
      message: 'Email is available.',
      isUnique: true 
    });
  } catch (_error: unknown) {
    res.status(400).json({ success: false, message: 'Invalid email address.' });
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

export const getSetupPositions: AsyncHandler = async (_req, res) => {
  try {
    // 1. Ensure HR Department exists with official name
    const hrDept = await db.query.departments.findFirst({
      where: eq(departments.name, "Office of the City Human Resource Management Officer")
    });

    if (!hrDept) {
      res.status(500).json({ success: false, message: "HR Department not initialized. Please run the seeding script." });
      return;
    }

    // 2. Fetch the top 2 seeded positions for HR
    const positions = await db.query.plantillaPositions.findMany({
      where: eq(plantillaPositions.departmentId, hrDept.id),
      orderBy: [desc(plantillaPositions.salaryGrade)],
      limit: 2
    });

    if (positions.length === 0) {
      res.status(500).json({ success: false, message: "HR positions not found. Please run the seeding script." });
      return;
    }

    // 3. Check if initialization is already complete (no more vacant setup positions)
    const vacantSetupPositions = positions.filter(p => p.isVacant);

    // 4. Generate the NEXT available numeric ID to pass to the frontend
    // NO LONGER GENERATING THIS IN SETUP PORTAL - See User Request
    const reservedId = null;

    // 5. Enumerated Types for Frontend (No Hardcoding)
    const appointmentTypes = ['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS'];
    const dutyTypes = ['Standard', 'Irregular'];
    const roles = ['Administrator', 'Human Resource'];

    res.status(200).json({ 
      success: true, 
      departmentId: hrDept.id, 
      positions: vacantSetupPositions,
      reservedId,
      appointmentTypes,
      dutyTypes,
      roles
    });
  } catch (_error: unknown) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const setupPortal: AsyncHandler = async (req, res) => {
  try {
    const validatedData = SetupPortalSchema.parse(req.body);
    const { 
      firstName, middleName, lastName, suffix, email, password, 
      departmentId, positionId, role, dutyType, appointmentType 
    } = validatedData;

    const safeFirstName = sanitizeInput(firstName);
    const safeMiddleName = middleName ? sanitizeInput(middleName) : null;
    const safeLastName = sanitizeInput(lastName);
    const safeSuffix = suffix ? sanitizeInput(suffix) : null;

    const hrDept = await db.query.departments.findFirst({
      where: eq(departments.id, departmentId)
    });

    if (!hrDept) {
      res.status(400).json({ success: false, message: "Invalid department." });
      return;
    }

    const selectedPosition = await db.query.plantillaPositions.findFirst({
      where: and(
        eq(plantillaPositions.id, positionId),
        eq(plantillaPositions.isVacant, true)
      )
    });
    
    if (!selectedPosition) {
      res.status(400).json({ success: false, message: "Position is either invalid or already filled." });
      return;
    }

    // Verify email uniqueness
    const existing = await db.query.authentication.findFirst({ where: eq(authentication.email, email) });
    if (existing) {
      res.status(400).json({ success: false, message: "Email already exists." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate Verification OTP
    const verificationOTP = generateOTP();

    // The Setup Portal should strictly NOT assign an Employee ID yet.
    // That happens later during biometric registration.

    await db.transaction(async (tx) => {
      const [authResult] = await tx.insert(authentication).values({
        firstName: safeFirstName,
        middleName: safeMiddleName,
        lastName: safeLastName,
        suffix: safeSuffix,
        email,
        passwordHash,
        role: role,
        isVerified: true, // System initiators (Admin/HR) from Setup Portal are pre-verified
        verificationToken: null,
      });

      const newUserId = authResult.insertId;

      // Insert HR Details
      await tx.insert(pdsHrDetails).values({
        employeeId: newUserId,
        departmentId: hrDept.id,
        positionId: selectedPosition.id,
        jobTitle: selectedPosition.itemNumber 
          ? `${selectedPosition.positionTitle} (${selectedPosition.itemNumber})`
          : selectedPosition.positionTitle,
        positionTitle: selectedPosition.positionTitle,
        salaryGrade: String(selectedPosition.salaryGrade),
        stepIncrement: selectedPosition.stepIncrement ?? 1,
        dutyType,
        appointmentType,
        employmentStatus: 'Active',
        profileStatus: 'Initial',
        firstDayOfService: new Date().toISOString().split('T')[0]
      });

      // Update position status
      await tx.update(plantillaPositions)
        .set({ 
          isVacant: false, 
          incumbentId: newUserId,
          filledDate: new Date().toISOString().split('T')[0]
        })
        .where(eq(plantillaPositions.id, selectedPosition.id));
    });

    // Send Verification Email
    try {
      await sendOTPEmail(email, safeFirstName, verificationOTP, 'System Initialization: Verify Your Email', 'Welcome to the system. Please use the code below to verify your administrative access:');
    } catch (_emailErr: unknown) {
      /* empty */

    }

    res.status(201).json({ 
      success: true, 
      message: `${role} account created. Please verify your email.`,
      data: { email, role: role }
    });
  } catch (_error: unknown) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const checkGovtIdUniqueness: AsyncHandler = async (req, res) => {
  try {
    const { 
      umidNumber, 
      philsysId, 
      philhealthNumber, 
      pagibigNumber, 
      tinNumber, 
      gsisNumber,
      excludeAuthId,
      excludeApplicantId
    } = req.query;

    const errors = await checkSystemWideUniqueness({
      umidNumber: String(umidNumber || ''),
      philsysId: String(philsysId || ''),
      philhealthNumber: String(philhealthNumber || ''),
      pagibigNumber: String(pagibigNumber || ''),
      tinNumber: String(tinNumber || ''),
      gsisNumber: String(gsisNumber || ''),
      excludeAuthId: excludeAuthId ? Number(excludeAuthId) : undefined,
      excludeApplicantId: excludeApplicantId ? Number(excludeApplicantId) : undefined
    });

    if (Object.keys(errors).length > 0) {
      res.status(409).json({
        success: false,
        isUnique: false,
        message: Object.values(errors)[0],
        conflicts: errors,
        errors: Object.values(errors)
      });
      return;
    }

    res.status(200).json({
      success: true,
      isUnique: true,
      message: 'Government ID is unique and available.'
    });
    return;
  } catch (error: unknown) {
    console.error('Check Govt ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during uniqueness check.',
      error: error instanceof Error ? error.message : String(error)
    });
    return;
  }
};
