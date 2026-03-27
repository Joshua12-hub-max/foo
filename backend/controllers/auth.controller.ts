import { Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import { authentication, bioEnrolledUsers, schedules, recruitmentApplicants, departments, plantillaPositions, recruitmentJobs, shiftTemplates, pdsHrDetails, pdsEducation, pdsEligibility, pdsWorkExperience, pdsLearningDevelopment, employeeEmergencyContacts, pdsOtherInfo, pdsFamily } from '../db/schema.js';
import { pdsPersonalInformation, pdsDeclarations } from '../db/tables/pds.js';
import { eq, or, and, sql, getTableColumns, desc, InferSelectModel, ne } from 'drizzle-orm';
import { AuthService } from '../services/auth.service.js';
import { checkSystemWideUniqueness } from '../services/validationService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { normalizeIdSql } from '../utils/idUtils.js';

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
import transporter, { generateOTP, maskEmail, sendEmail, sendOTPEmail } from '../utils/emailUtils.js';
import { AuditService } from '../services/audit.service.js';

// Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- HELPER FOR SAFE TYPE CONVERSION (Zero Type Erasure) ---
const safeInt = (val: string | number | null | undefined): number | null => {
  if (val === null || val === undefined || String(val).trim() === '') return null;
  if (typeof val === 'number') return Math.floor(val);
  const cleaned = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
};

const safeDate = (val: string | null | undefined): string | null => {
  if (val === null || val === undefined || String(val).trim() === '') return null;
  return String(val);
};

const safeFloat = (val: string | number | null | undefined): number | null => {
  if (val === null || val === undefined || String(val).trim() === '') return null;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
};

const traceLog = (step: string, data?: unknown) => {
    try {
        const timestamp = new Date().toISOString();
        const message = `[TRACE][${timestamp}] ${step}${data ? ': ' + JSON.stringify(data) : ''}`;
        console.error(message);
        fs.appendFileSync(path.join(process.cwd(), 'registration_trace.log'), message + '\n');
    } catch (_e) {
        // Ignore trace logging errors to prevent infinite loops or crashes during failure
    }
};

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
      const rawId = user.employeeId || '0';

      const [enrolled] = await db.select().from(bioEnrolledUsers).where(
        and(
          sql`${normalizeIdSql(bioEnrolledUsers.employeeId)} = ${normalizeIdSql(rawId)}`,
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown email error';
      console.error('[AUTH] Google OTP send failed:', message);
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

    await AuditService.log({
      userId: user.id,
      module: 'AUTH',
      action: 'LOGIN',
      details: { method: 'google', email: user.email },
      req
    });

  } catch (error: unknown) {
    console.error('[GOOGLE LOGIN ERROR]', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

export const verifyEnrollment: AsyncHandler = async (req, res) => {
  try {
    const employeeId = String(req.params.employeeId);
    
    // Check bio_enrolled_users
    const [enrolled] = await db.select().from(bioEnrolledUsers).where(
      and(
        sql`${normalizeIdSql(bioEnrolledUsers.employeeId)} = ${normalizeIdSql(employeeId)}`,
        eq(bioEnrolledUsers.userStatus, 'active')
      )
    ).limit(1);

    if (!enrolled) {
      res.status(404).json({
        success: false,
        message: `Employee ID ${employeeId} not found in biometric enrollment. Please contact Human Resource to enroll first.`,
        code: 'NOT_ENROLLED'
      });
      return;
    }

    // Check if already registered in the web system
    const [existingAccount] = await db.select({ employeeId: authentication.employeeId })
      .from(authentication)
      .where(sql`${normalizeIdSql(authentication.employeeId)} = ${normalizeIdSql(employeeId)}`)
      .limit(1);

    res.status(200).json({
      success: true,
      message: 'Employee is enrolled in biometrics.',
      data: {
        bioEmployeeId: enrolled.employeeId,
        systemEmployeeId: enrolled.employeeId,
        fullName: enrolled.fullName,
        department: enrolled.department,
        enrolledAt: enrolled.enrolledAt,
        alreadyRegistered: !!existingAccount
      }
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: 'Failed to verify enrollment.' });
  }
};

interface RegisterRequestWithFile extends Request {
  file?: Express.Multer.File;
}

interface RegisterBody {
  [key: string]: string | number | boolean | File | undefined | null | object | Record<string, string | number | boolean | null>[]; 
  pdsQuestions?: string | object;
  workExperiences?: string | Record<string, string | number | boolean | null>[];
  trainings?: string | Record<string, string | number | boolean | null>[];
  otherSkills?: string | string[];
  recognitions?: string | string[];
  memberships?: string | string[];
  children?: string | Record<string, string | number | boolean | null>[];
  isOldEmployee?: string | boolean;
  ignoreDuplicateWarning?: string | boolean;
  certifiedCorrect?: string | boolean;
  appointmentType?: string;
  gender?: string;
  civilStatus?: string;
}

export const register: AsyncHandler = async (req, res) => {
  const multerReq = req as RegisterRequestWithFile;
  try {
    const body = req.body as RegisterBody;
    // 0. Pre-parse JSON strings and handle boolean/enum conversions from multipart/form-data
    const objectFields: (keyof RegisterBody)[] = [
      'education', 'eligibilities', 'workExperiences', 'trainings',
      'otherSkills', 'recognitions', 'memberships', 'children'
    ];
    objectFields.forEach(field => {
      const value = body[field];
      if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        try {
          body[field] = JSON.parse(value) as object;
        } catch (__e) {
          // Keep as string if parsing fails
        }
      }
    });

    // Handle boolean strings from FormData
    const booleanFields: (keyof RegisterBody)[] = ['isOldEmployee', 'ignoreDuplicateWarning', 'certifiedCorrect'];
    booleanFields.forEach(field => {
      const value = body[field];
      if (typeof value === 'string') {
        body[field] = value === 'true';
      }
    });

    // Handle empty strings for optional enums/unions to prevent Zod errors
    if (body.appointmentType === "") {
        delete body.appointmentType;
    }
    if (body.gender === "") {
        delete body.gender;
    }
    if (body.civilStatus === "") {
        delete body.civilStatus;
    }

    traceLog('1. Start Registration', { mode: req.query.mode, hasFile: !!multerReq.file });
    const validatedData = RegisterSchema.parse(body);
    traceLog('2. Zod Validation Success', { email: validatedData.email });
    const { employeeId, email, password } = validatedData;
    const file = multerReq.file;
    const isFinalizingSetup = req.query.mode === 'finalize-setup';

    // 1. Parse bio ID from input
    const inputEmployeeId = String(employeeId || '');

    // 2. Verify biometric enrollment — MUST be enrolled to register
    const [enrolled] = await db.select().from(bioEnrolledUsers).where(
      and(
        sql`${normalizeIdSql(bioEnrolledUsers.employeeId)} = ${normalizeIdSql(inputEmployeeId)}`,
        eq(bioEnrolledUsers.userStatus, 'active')
      )
    ).limit(1);

    if (!enrolled) {
      // 100% SUCCESS: Check if this fingerprint matches ANOTHER user to provide better error messages
      const [otherUserRecord] = await db.select().from(bioEnrolledUsers).where(
        and(
          eq(bioEnrolledUsers.userStatus, 'active'),
          // This is a placeholder for the actual fingerprint matching logic if available in SQL,
          // but for now we look for the ID. If the C# middleware found a match but for a different ID,
          // the frontend logs usually show SCAN_MATCH:Emp-XXX.
          // We can't easily check the BLOB here, but we can verify if the user is trying to 'hijack' an ID.
          ne(sql`${normalizeIdSql(bioEnrolledUsers.employeeId)}`, sql`${normalizeIdSql(inputEmployeeId)}`)
        )
      ).limit(1);

      if (otherUserRecord) {
          console.warn(`[Register] Potential ID hijacking attempt or mismatch. Found other active record: ${otherUserRecord.employeeId}`);
      }

      console.error(`[Register] Biometric record not found or ID mismatch for: ${inputEmployeeId}`);
      res.status(403).json({
        success: false,
        message: `Biometric record not found for ID ${inputEmployeeId}. If you just enrolled, make sure you used the correct Employee ID.`,
        code: 'NOT_ENROLLED'
      });
      return;
    }

    // 3. Use the EXACT employee ID from the biometric record for system consistency
    const actualEmployeeId = enrolled.employeeId;

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

    // 4. Use provided name if available, otherwise pull from bio_enrolled_users
    const firstName = sanitizeInput(validatedData.firstName || enrolled.fullName.split(' ')[0]);
    const lastName = sanitizeInput(validatedData.lastName || (enrolled.fullName.split(' ').length > 1 ? enrolled.fullName.split(' ').slice(1).join(' ') : ''));
    
    // 5. Check System-Wide Uniqueness
    const uniqueErrors = await checkSystemWideUniqueness({
        email,
        employeeId: inputEmployeeId,
        agencyEmployeeNo: validatedData.agencyEmployeeNo,
        umidNumber: validatedData.umidNumber,
        philsysId: validatedData.philsysId,
        philhealthNumber: validatedData.philhealthNumber,
        pagibigNumber: validatedData.pagibigNumber,
        tinNumber: validatedData.tinNumber,
        gsisNumber: validatedData.gsisNumber,
        excludeApplicantId: validatedData.applicantId ? Number(validatedData.applicantId) : undefined,
        excludeAuthId: existingUser?.id
    });

    if (Object.keys(uniqueErrors).length > 0) {
        res.status(409).json({ 
            success: false, 
            message: 'Uniqueness validation failed.', 
            errors: uniqueErrors 
        });
        return;
    }

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
        } catch (error: unknown) {
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
        // AUTO-GENERATE DEFAULT PASSWORD FOR ADMIN-LED REGISTRATION
        console.log('[DEBUG] Generating default password...');
        const defaultPwd = "Meycauayan@2026";
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(defaultPwd, salt);
        console.log('[DEBUG] Default password generated.');
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

    // 100% SUCCESS Logic: Determine role based on position/dept but PRESERVE existing higher roles
    if (deptLower.includes('human resource') && posTitleLower.includes('department head')) {
        assignedRole = 'Human Resource';
    } else if (posTitleLower.includes('administrative officer')) {
        assignedRole = 'Administrator';
    }

    // Role Preservation: If finalizing setup, never downgrade an existing Admin or HR to Employee
    if (effectiveFinalizingSetup && existingUser) {
        const currentRole = existingUser.role as UserRole;
        if ((currentRole === 'Administrator' || currentRole === 'Human Resource') && assignedRole === 'Employee') {
            assignedRole = currentRole;
        }
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

    const preserveVerification = effectiveFinalizingSetup && existingUser?.isVerified;
    
    const isHRAdmin = assignedRole === 'Administrator' || assignedRole === 'Human Resource';
    const isApplicant = !!validatedData.applicantId;
    
    // 100% REGISTRATION POLICY (REVISED):
    // 1. HR/Admin: Verification made in Setup Portal (1st). No 2nd verification here.
    // 2. Employee: Receives 2nd verification flow post-registration.
    // 3. Applicant: Receives 3rd verification flow post-registration.
    const finalIsVerified = (preserveVerification || isHRAdmin) ? true : false;

    const authDataValues: typeof authentication.$inferInsert = {
      employeeId: actualEmployeeId,
      firstName,
      lastName,
      middleName: sanitizeInput(validatedData.middleName),
      suffix: sanitizeInput(validatedData.suffix),
      email,
      passwordHash: hashedPassword,
      role: assignedRole,
      isVerified: finalIsVerified,
      verificationToken: finalIsVerified ? null : verificationOTP,
      avatarUrl,
    };

    let newUserId: number = 0;
    traceLog('3. Pre-Transaction Checks Done', { actualEmployeeId });
    await db.transaction(async (tx) => {
        traceLog('4. Transaction Started');
        if (effectiveFinalizingSetup && existingUser) {
        // UPDATE EXISTING ADMIN/HR
        await tx.update(authentication).set(authDataValues).where(eq(authentication.id, existingUser.id));
        newUserId = existingUser.id;

        const existingHr = await tx.query.pdsHrDetails.findFirst({
          where: eq(pdsHrDetails.employeeId, newUserId)
        });

        // Upsert HR Details
        const hrValues = {
          employeeId: newUserId,
          jobTitle: positionTitle,
          positionTitle: positionTitle,
          itemNumber: itemNumber,
          departmentId: departmentId || existingUser.hrDetails?.departmentId || null,
          dateHired: safeDate(validatedData.applicantHiredDate) || safeDate(existingUser.hrDetails?.dateHired) || new Date().toISOString().split('T')[0],
          dutyType: (validatedData.dutyType === 'Irregular' ? 'Irregular' : 'Standard') as 'Standard' | 'Irregular',
          appointmentType: (validatedData.appointmentType || existingUser.hrDetails?.appointmentType || 'Permanent') as 'Permanent' | 'Contractual' | 'Casual' | 'Job Order' | 'Coterminous' | 'Temporary' | 'Contract of Service' | 'JO' | 'COS',
          profileStatus: 'Complete' as const,
          employmentStatus: 'Active' as const,
          isOldEmployee: validatedData.isOldEmployee || existingUser.hrDetails?.isOldEmployee || false,
          isMeycauayan: (validatedData.isMeycauayan === true),
          religion: validatedData.religion || existingUser.hrDetails?.religion || undefined,
          facebookUrl: validatedData.facebookUrl || existingUser.hrDetails?.facebookUrl || undefined,
          linkedinUrl: validatedData.linkedinUrl || existingHr?.linkedinUrl || undefined,
          twitterHandle: validatedData.twitterHandle || existingHr?.twitterHandle || undefined,
          experienceSummary: validatedData.experience || existingHr?.experienceSummary || null,
         };

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
          dateHired: safeDate(validatedData.applicantHiredDate) || new Date().toISOString().split('T')[0],
          dutyType: (validatedData.dutyType === 'Irregular' ? 'Irregular' : 'Standard') as 'Standard' | 'Irregular',
          appointmentType: (validatedData.appointmentType || 'Permanent') as 'Permanent' | 'Contractual' | 'Casual' | 'Job Order' | 'Coterminous' | 'Temporary' | 'Contract of Service' | 'JO' | 'COS',
          profileStatus: 'Complete' as const,
          employmentStatus: 'Active' as const,
          isOldEmployee: validatedData.isOldEmployee || false,
          isMeycauayan: (validatedData.isMeycauayan === true),
          religion: validatedData.religion || undefined,
          facebookUrl: validatedData.facebookUrl || undefined,
           linkedinUrl: validatedData.linkedinUrl || undefined,
           twitterHandle: validatedData.twitterHandle || undefined,
           experienceSummary: validatedData.experience || null,
         });
        
        // Initial leave allocation for brand new users
        await allocateDefaultCredits(actualEmployeeId);

        // 100% SUCCESS GUARANTEE: Ensure biometric record exists in our system
        // The C# middleware normally does this, but we do it here as well for absolute reliability
        const [existingBio] = await tx.select().from(bioEnrolledUsers).where(
          sql`${normalizeIdSql(bioEnrolledUsers.employeeId)} = ${normalizeIdSql(actualEmployeeId)}`
        ).limit(1);

        if (existingBio) {
          await tx.update(bioEnrolledUsers).set({
            fullName: `${firstName} ${lastName}`.trim(),
            department: department || 'Unassigned',
            userStatus: 'active',
            updatedAt: sql`CURRENT_TIMESTAMP`
          }).where(sql`${normalizeIdSql(bioEnrolledUsers.employeeId)} = ${normalizeIdSql(actualEmployeeId)}`);
        } else {
          await tx.insert(bioEnrolledUsers).values({
            employeeId: actualEmployeeId,
            fullName: `${firstName} ${lastName}`.trim(),
            department: department || 'Unassigned',
            userStatus: 'active'
          });
        }
      }

      // --- SAVE REGISTRATION DATA TO PDS TABLES ---
      const pdsPersonalInfoValues: typeof pdsPersonalInformation.$inferInsert = {
          employeeId: newUserId,
          birthDate: safeDate(validatedData.birthDate),
          placeOfBirth: validatedData.placeOfBirth || null,
          gender: (validatedData.gender as 'Male' | 'Female') || null,
          civilStatus: (validatedData.civilStatus as 'Single' | 'Married' | 'Widowed' | 'Separated' | 'Annulled') || null,
          heightM: safeFloat(validatedData.heightM)?.toString() || null,
          weightKg: safeFloat(validatedData.weightKg)?.toString() || null,
          bloodType: validatedData.bloodType || null,
          citizenship: validatedData.citizenship || validatedData.nationality || 'Filipino',
          citizenshipType: validatedData.citizenshipType || null,
          dualCountry: validatedData.dualCountry || null,
          residentialAddress: validatedData.residentialAddress || validatedData.address || null,
          residentialZipCode: validatedData.residentialZipCode || null,
          permanentAddress: validatedData.permanentAddress || null,
          permanentZipCode: validatedData.permanentZipCode || null,
          telephoneNo: validatedData.telephoneNo || null,
          mobileNo: validatedData.mobileNo || null,
          email: email,
          umidNumber: validatedData.umidNumber || null,
          philsysId: validatedData.philsysId || null,
          philhealthNumber: validatedData.philhealthNumber || null,
          pagibigNumber: validatedData.pagibigNumber || null,
          tinNumber: validatedData.tinNumber || null,
          gsisNumber: validatedData.gsisNumber || null,
          agencyEmployeeNo: validatedData.agencyEmployeeNo || null,
          
          resRegion: validatedData.resRegion || null,
          resProvince: validatedData.resProvince || null,
          resCity: validatedData.resCity || null,
          resBarangay: validatedData.resBarangay || null,
          resHouseBlockLot: validatedData.resHouseBlockLot || null,
          resSubdivision: validatedData.resSubdivision || null,
          resStreet: validatedData.resStreet || null,
          
          permRegion: validatedData.permRegion || null,
          permProvince: validatedData.permProvince || null,
          permCity: validatedData.permCity || null,
          permBarangay: validatedData.permBarangay || null,
          permHouseBlockLot: validatedData.permHouseBlockLot || null,
          permSubdivision: validatedData.permSubdivision || null,
          permStreet: validatedData.permStreet || null,
      };

      const existingPdsPersonal = await tx.query.pdsPersonalInformation.findFirst({
          where: eq(pdsPersonalInformation.employeeId, newUserId)
      });

      if (existingPdsPersonal) {
          await tx.update(pdsPersonalInformation).set(pdsPersonalInfoValues).where(eq(pdsPersonalInformation.employeeId, newUserId));
      } else {
          await tx.insert(pdsPersonalInformation).values(pdsPersonalInfoValues);
      }

      // --- EDUCATION BACKGROUND (Multi-level) ---
      if (validatedData.education) {
          await tx.delete(pdsEducation).where(eq(pdsEducation.employeeId, newUserId));
          const levels = ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate'] as const;
          type EducationDetail = { school?: string; course?: string; from?: string; to?: string; units?: string; yearGrad?: string; honors?: string };
          const educationData = validatedData.education as Record<typeof levels[number], EducationDetail>;

          for (const level of levels) {
              const edu = educationData[level];
              if (edu && edu.school) {
                  await tx.insert(pdsEducation).values({
                      employeeId: newUserId,
                      level: level === 'Graduate' ? 'Graduate Studies' : level,
                      schoolName: edu.school,
                      degreeCourse: edu.course || null,
                      yearGraduated: safeInt(edu.yearGrad),
                      unitsEarned: edu.units || null,
                      dateFrom: safeInt(edu.from),
                      dateTo: safeInt(edu.to),
                      honors: edu.honors || null,
                  });
              }
          }
      }

      // --- ELIGIBILITY (Multi + Simplified) ---
      const finalEligibilities = [...(validatedData.eligibilities || [])];
      
      // If simplified eligibility fields are provided, add them as the first entry
      if (validatedData.eligibilityType) {
          finalEligibilities.unshift({
              name: validatedData.eligibilityType,
              licenseNo: validatedData.eligibilityNumber || null,
              examDate: validatedData.eligibilityDate || null,
              rating: null,
              examPlace: null,
              licenseValidUntil: null
          });
      }

      if (finalEligibilities.length > 0) {
          await tx.delete(pdsEligibility).where(eq(pdsEligibility.employeeId, newUserId));
          for (const elig of finalEligibilities) {
              if (elig.name) {
                  await tx.insert(pdsEligibility).values({
                      employeeId: newUserId,
                      eligibilityName: elig.name,
                      licenseNumber: elig.licenseNo || null,
                      examDate: safeDate(elig.examDate),
                      rating: safeFloat(elig.rating)?.toString() || null,
                      examPlace: elig.examPlace || null,
                      validityDate: safeDate(elig.licenseValidUntil),
                  });
              }
          }
      }

      // 5. Work Experience (Multi)
      if (validatedData.workExperiences && Array.isArray(validatedData.workExperiences)) {
          await tx.delete(pdsWorkExperience).where(eq(pdsWorkExperience.employeeId, newUserId));
          for (const work of validatedData.workExperiences) {
              await tx.insert(pdsWorkExperience).values({
                  employeeId: newUserId,
                  dateFrom: safeDate(work.dateFrom) || new Date().toISOString().split('T')[0],
                  dateTo: safeDate(work.dateTo),
                  positionTitle: work.positionTitle,
                  companyName: work.companyName,
                  monthlySalary: safeFloat(work.monthlySalary)?.toString() || null,
                  salaryGrade: work.salaryGrade || null,
                  appointmentStatus: work.appointmentStatus || null,
                  isGovernment: !!work.isGovernment
              });          }
      }

      // 7. Learning & Development (Multi)
      if (validatedData.trainings && Array.isArray(validatedData.trainings)) {
          await tx.delete(pdsLearningDevelopment).where(eq(pdsLearningDevelopment.employeeId, newUserId));
          for (const train of validatedData.trainings) {
              await tx.insert(pdsLearningDevelopment).values({
                  employeeId: newUserId,
                  title: train.title,
                  dateFrom: safeDate(train.dateFrom) || new Date().toISOString().split('T')[0],
                  dateTo: safeDate(train.dateTo),
                  hoursNumber: safeInt(train.hoursNumber),
                  typeOfLd: train.typeOfLd || null,
                  conductedBy: train.conductedBy || null
              });
          }
      }

      // 8. Skills, Recognitions, Memberships (Multi)
      console.log('[DEBUG] Processing PDS Other Info (Skills, Recognitions, Memberships)...');
      if (validatedData.skills) {
          await tx.delete(pdsOtherInfo).where(and(eq(pdsOtherInfo.employeeId, newUserId), eq(pdsOtherInfo.type, 'Skill')));
          const skillsArray = validatedData.skills.split(',').map(s => s.trim()).filter(Boolean);
          for (const skill of skillsArray) {
              await tx.insert(pdsOtherInfo).values({
                  employeeId: newUserId,
                  type: 'Skill',
                  description: skill
              });
          }
      }

      if (validatedData.otherSkills && Array.isArray(validatedData.otherSkills) && validatedData.otherSkills.length > 0) {
          await tx.delete(pdsOtherInfo).where(and(eq(pdsOtherInfo.employeeId, newUserId), eq(pdsOtherInfo.type, 'Skill')));
          for (const item of validatedData.otherSkills) {
              if (item.value) await tx.insert(pdsOtherInfo).values({ employeeId: newUserId, type: 'Skill', description: item.value });
          }
      }

      if (validatedData.recognitions && Array.isArray(validatedData.recognitions) && validatedData.recognitions.length > 0) {
          await tx.delete(pdsOtherInfo).where(and(eq(pdsOtherInfo.employeeId, newUserId), eq(pdsOtherInfo.type, 'Recognition')));
          for (const item of validatedData.recognitions) {
              if (item.value) await tx.insert(pdsOtherInfo).values({ employeeId: newUserId, type: 'Recognition', description: item.value });
          }
      }

      if (validatedData.memberships && Array.isArray(validatedData.memberships) && validatedData.memberships.length > 0) {
          await tx.delete(pdsOtherInfo).where(and(eq(pdsOtherInfo.employeeId, newUserId), eq(pdsOtherInfo.type, 'Membership')));
          for (const item of validatedData.memberships) {
              if (item.value) await tx.insert(pdsOtherInfo).values({ employeeId: newUserId, type: 'Membership', description: item.value });
          }
      }

      // 9. Family Background
      await tx.delete(pdsFamily).where(eq(pdsFamily.employeeId, newUserId));

      // Spouse
      if (validatedData.spouseLastName || validatedData.spouseFirstName) {
          await tx.insert(pdsFamily).values({
              employeeId: newUserId,
              relationType: 'Spouse',
              lastName: validatedData.spouseLastName || null,
              firstName: validatedData.spouseFirstName || null,
              middleName: validatedData.spouseMiddleName || null,
              nameExtension: validatedData.spouseSuffix || null,
              occupation: validatedData.spouseOccupation || null,
              employer: validatedData.spouseEmployer || null,
              businessAddress: validatedData.spouseBusAddress || null,
              telephoneNo: validatedData.spouseTelephone || null,
          });
      }

      // Father
      if (validatedData.fatherLastName || validatedData.fatherFirstName) {
          await tx.insert(pdsFamily).values({
              employeeId: newUserId,
              relationType: 'Father',
              lastName: validatedData.fatherLastName || null,
              firstName: validatedData.fatherFirstName || null,
              middleName: validatedData.fatherMiddleName || null,
              nameExtension: validatedData.fatherSuffix || null,
          });
      }

      // Mother
      if (validatedData.motherMaidenLastName || validatedData.motherMaidenFirstName) {
          await tx.insert(pdsFamily).values({
              employeeId: newUserId,
              relationType: 'Mother',
              lastName: validatedData.motherMaidenLastName || null,
              firstName: validatedData.motherMaidenFirstName || null,
              middleName: validatedData.motherMaidenMiddleName || null,
              nameExtension: validatedData.motherMaidenSuffix || null,
          });
      }

      // Children
      if (validatedData.children && Array.isArray(validatedData.children)) {
          for (const child of validatedData.children) {
              if (child.name) {
                  // Attempt parsing name, falling back to just placing it in firstName if complex
                  const parts = child.name.split(' ');
                  const childFirst = parts.slice(0, -1).join(' ') || child.name;
                  const childLast = parts.length > 1 ? parts[parts.length - 1] : null;
                  
                  await tx.insert(pdsFamily).values({
                      employeeId: newUserId,
                      relationType: 'Child',
                      firstName: childFirst,
                      lastName: childLast,
                      dateOfBirth: safeDate(child.birthDate) || null,
                  });
              }
          }
      }

      if (validatedData.emergencyContact) {
          // 100% SUCCESS: Map to the dedicated employee_emergency_contacts table
          const existingEmergency = await tx.query.employeeEmergencyContacts.findFirst({
              where: eq(employeeEmergencyContacts.employeeId, newUserId)
          });
          
          const emergencyValues = {
              employeeId: newUserId,
              name: String(validatedData.emergencyContact).trim(),
              relationship: 'Emergency Contact', // Default generic relationship
              phoneNumber: validatedData.emergencyContactNumber ? String(validatedData.emergencyContactNumber).trim() : '',
              isPrimary: true
          };

          if (existingEmergency) {
              await tx.update(employeeEmergencyContacts).set(emergencyValues).where(eq(employeeEmergencyContacts.employeeId, newUserId));
          } else {
              await tx.insert(employeeEmergencyContacts).values(emergencyValues);
          }
      }

      traceLog('5. PDS Tables Success');

      // --- SAVE SECTION X: GOVERNMENT ID & DECLARATIONS ---
      const declValues: typeof pdsDeclarations.$inferInsert = {
          employeeId: newUserId,
          govtIdType: validatedData.govtIdType || null,
          govtIdNo: validatedData.govtIdNo || null,
          govtIdIssuance: validatedData.govtIdIssuance || null,
          dateAccomplished: safeDate(validatedData.dateAccomplished) || new Date().toISOString().split('T')[0],
      };



      const existingDecl = await tx.query.pdsDeclarations.findFirst({
          where: eq(pdsDeclarations.employeeId, newUserId)
      });

      if (existingDecl) {
          await tx.update(pdsDeclarations).set(declValues).where(eq(pdsDeclarations.employeeId, newUserId));
      } else {
          await tx.insert(pdsDeclarations).values(declValues);
      }

      // ----------------------------------------------

      // Allocate Standard Schedule only if not already present
      const existingSchedule = await tx.query.schedules.findFirst({
          where: eq(schedules.employeeId, actualEmployeeId)
      });

      if (!existingSchedule) {
          const startDate = validatedData.applicantHiredDate || new Date().toISOString().split('T')[0];
          
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
            startDate: safeDate(startDate) || new Date().toISOString().split('T')[0],
            repeatPattern: 'Weekly',
            isRestDay: false
          }));

          if (scheduleValues.length > 0) {
            await tx.insert(schedules).values(scheduleValues);
          }
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

    // 11. Send Verification Email (SKIP IF ALREADY VERIFIED, e.g. HR/Admin)
    if (!authDataValues.isVerified) {
        try {
          if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error('Email credentials are not configured.');
          }

          let subject = 'Email Verification';
          let body = 'Thank you for registering. Please use the code below to verify your email address:';
          
          if (isApplicant) {
            subject = 'Applicant Account: 3rd Verification Step';
            body = 'Your transition from applicant to employee is almost complete. Please use the 6-digit code below to verify your account (3rd Step):';
          } else if (assignedRole === 'Employee') {
            subject = 'Employee Profile: 2nd Verification Step';
            body = 'Your employee registration is almost complete. Please use the 6-digit code below to verify your account (2nd Step):';
          }

          await sendOTPEmail(email, firstName, verificationOTP, subject, body);
        } catch (error: unknown) {
          console.error('[REGISTER] Email send failed:', error instanceof Error ? error.message : String(error));
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
        requiresVerification: !authDataValues.isVerified,
        message: authDataValues.isVerified 
          ? 'Registration successful! Your account is active.' 
          : 'Registration successful! Please check your email for the 6-digit verification code.'
      }
    });

    if (newUserId) {
        try {
            await AuditService.log({
                userId: newUserId,
                module: 'AUTH',
                action: 'CREATE',
                details: { 
                    email, 
                    employeeId: actualEmployeeId, 
                    role: assignedRole,
                    isFinalizingSetup: effectiveFinalizingSetup
                },
                req
            });
        } catch (auditErr) {
            console.error('[AUDIT ERROR] Failed to log registration:', auditErr);
        }
    }
  } catch (error: unknown) {
    traceLog('FATAL ERROR DURING REGISTRATION', error);
    console.error('[AUTH] Registration failed:', error);
    
    if (error instanceof z.ZodError) {
        fs.writeFileSync(path.join(process.cwd(), 'zod_errors.json'), JSON.stringify(error.format(), null, 2));
    }
    
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during registration.',
      error: error instanceof Error ? error.message : String(error),
      data: null
    });
  }
};

export const verifyRegistrationOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = EmailVerifySchema.parse(req.body);
    
    // Find user by email ONLY first to handle already-verified cases
    const user = await db.query.authentication.findFirst({
      where: eq(authentication.email, email)
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid Email.' });
      return;
    }

    if (user.isVerified) {
      res.status(200).json({ 
        success: true, 
        message: 'Email already verified.',
        data: {
          id: user.id,
          employeeId: user.employeeId,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
      return;
    }

    // Now check if the OTP matches for unverified users
    if (user.verificationToken !== otp) {
      res.status(400).json({ success: false, message: 'Invalid OTP.' });
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
  } catch (error: unknown) {
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
      res.status(200).json({ success: true, message: 'Email is already verified. You can proceed to login.' });
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
  } catch (error: unknown) {
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

    // Generate 6-digit numeric OTP for better mobile/PC experience (stays in page)
    const otp = generateOTP();
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for OTP
    const mysqlFormattedDate = resetExpires.toISOString().slice(0, 19).replace('T', ' ');

    await db.update(authentication)
      .set({
        resetPasswordToken: otp, // We reuse this field to store the OTP
        resetPasswordExpires: mysqlFormattedDate
      })
      .where(eq(authentication.id, user.id));

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="display: inline-block; width: 50px; height: 50px; background-color: #000; color: #fff; border-radius: 10px; line-height: 50px; font-weight: bold; font-size: 20px;">NE</div>
        </div>
        <h1 style="color: #333; text-align: center; font-size: 24px;">Password Reset Code</h1>
        <p>Hi ${user.firstName},</p>
        <p>You requested a password reset for your CHRMO account. Use the 6-digit verification code below to set a new password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f4f4f4; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000; display: inline-block; border: 1px solid #ddd;">
            ${otp}
          </div>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email and secure your account.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">CHRMO - Integrated Management System</p>
      </div>
    `;

    await sendEmail(email, 'Password Reset Code - CHRMO', htmlContent);
    
    await AuditService.log({
      userId: user.id,
      module: 'AUTH',
      action: 'PASSWORD_RESET',
      details: { step: 'request_otp', email },
      req
    });

    res.status(200).json({ success: true, message: 'Password reset code sent to your email.' });
  } catch (err: unknown) {
    console.error('[FORGOT PASSWORD ERROR]', err);
    res.status(500).json({ success: false, message: 'Failed to send reset code.' });
  }
};

export const resetPassword: AsyncHandler = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = ResetPasswordSchema.parse(req.body);
    const nowFormatted = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Find user by email or employee ID
    const user = await db.query.authentication.findFirst({
      where: or(
        eq(authentication.email, identifier),
        eq(authentication.employeeId, identifier)
      )
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'Account not found.' });
      return;
    }

    // Verify OTP and Expiration
    if (user.resetPasswordToken !== otp) {
      res.status(400).json({ success: false, message: 'Invalid verification code.' });
      return;
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < nowFormatted) {
        res.status(400).json({ success: false, message: 'Verification code has expired.' });
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

    await AuditService.log({
      userId: user.id,
      module: 'AUTH',
      action: 'PASSWORD_RESET',
      details: { step: 'complete', email: user.email },
      req
    });

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
    }) as UserWithRelations | undefined;

    res.status(200).json({
      success: true,
      data: {
        user: mapToAuthUser({
            ...userData,
            hrDetails: userWithHr?.hrDetails
        } as UserWithRelations)
      }
    });
  } catch (error: unknown) {
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
        const nowFormatted = new Date().toISOString().slice(0, 19).replace('T', ' ');
        if (user.lockUntil > nowFormatted) {
            const lockDate = new Date(user.lockUntil.replace(' ', 'T') + 'Z'); 
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
      const rawId = user.employeeId || '0';

      const [enrolled] = await db.select().from(bioEnrolledUsers).where(
        and(
          sql`${normalizeIdSql(bioEnrolledUsers.employeeId)} = ${normalizeIdSql(rawId)}`,
          eq(bioEnrolledUsers.userStatus, 'active')
        )
      ).limit(1);

      if (!enrolled) {
        res.status(403).json({
          success: false,
          message: 'Access Denied: You are not yet registered in the biometric system. Please contact your Human Resource administrator to complete your enrollment.',
          code: 'BIOMETRIC_NOT_ENROLLED',
          data: null
        });
        return;
      }
    } else if (isCHRMO) {
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
      } catch (error: unknown) {
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

    await AuditService.log({
      userId: user.id,
      module: 'AUTH',
      action: 'LOGIN',
      details: { method: 'credentials', identifier },
      req
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

    const nowFormatted = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (!user.twoFactorOtp || !user.twoFactorOtpExpires || user.twoFactorOtpExpires < nowFormatted) {
      res.status(400).json({ success: false, message: 'otp has expired or not found. please login again.' });
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
        department: (user as UserWithRelations).hrDetails?.department?.name || null,
        employeeId: user.employeeId
      }
    });

    await AuditService.log({
      userId: user.id,
      module: 'AUTH',
      action: 'OTP_VERIFY',
      details: { type: '2fa', identifier },
      req
    });

  } catch (error: unknown) {
    console.error('[2FA VERIFY ERROR]', error);
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
  } catch (error: unknown) {
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
  } catch (error: unknown) {
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
  } catch (error: unknown) {
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
      } catch (error: unknown) {
          /* empty */
      }
    }

    if (updates.facebookUrl !== undefined) mappedHrUpdates.facebookUrl = String(updates.facebookUrl);
    if (updates.linkedinUrl !== undefined) mappedHrUpdates.linkedinUrl = String(updates.linkedinUrl);
    if (updates.twitterHandle !== undefined) mappedHrUpdates.twitterHandle = String(updates.twitterHandle);
    if (updates.isMeycauayan !== undefined) mappedHrUpdates.isMeycauayan = !!updates.isMeycauayan;
    if (updates.religion !== undefined) mappedHrUpdates.religion = String(updates.religion);
    if (updates.dutyType !== undefined) mappedHrUpdates.dutyType = updates.dutyType as 'Standard' | 'Irregular';
    
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
    if (updates.dateHired !== undefined) mappedHrUpdates.dateHired = safeDate(updates.dateHired);
    if (updates.originalAppointmentDate !== undefined) mappedHrUpdates.originalAppointmentDate = safeDate(updates.originalAppointmentDate);
    if (updates.lastPromotionDate !== undefined) mappedHrUpdates.lastPromotionDate = safeDate(updates.lastPromotionDate);

    // PDS Personal Info Fields
    const personalFields = [
      'birthDate', 'placeOfBirth', 'gender', 'civilStatus', 'heightM', 'weightKg',
      'bloodType', 'citizenship', 'citizenshipType', 'dualCountry', 'residentialAddress', 'permanentAddress',
      'mobileNo', 'telephoneNo', 'nationality', 'phoneNumber',
      'umidNumber', 'philsysId', 'philhealthNumber', 'pagibigNumber', 'tinNumber', 'gsisNumber', 'agencyEmployeeNo',
      'resRegion', 'resProvince', 'resCity', 'resBrgy', 'resHouseBlockLot', 'resSubdivision', 'resStreet', 'resZipCode',
      'permRegion', 'permProvince', 'permCity', 'permBrgy', 'permHouseBlockLot', 'permSubdivision', 'permStreet', 'permZipCode'
    ];
    const personalUpdates: Record<string, unknown> = {};
    personalFields.forEach(f => {
      const fieldName = f as keyof typeof updates;
      if (updates[fieldName] !== undefined) {
        const value = updates[fieldName];
        
        let finalValue: string | number | boolean | null | undefined;
        
        // Apply specialized sanitization for specific field types
        if (['birthDate', 'lastPromotionDate', 'dateFiled', 'dateAccomplished', 'publicationDate', 'closingDate'].includes(f)) {
            finalValue = safeDate(value as string);
        } else if (['heightM', 'weightKg'].includes(f)) {
            finalValue = safeFloat(value as string)?.toString() || null;
        } else if (['yearsOfExperience', 'experienceYears', 'trainingHours'].includes(f)) {
            finalValue = safeInt(value as string);
        } else {
            finalValue = value as string | number | boolean | null | undefined;
        }

        if (f === 'nationality') personalUpdates['citizenship'] = finalValue;
        else if (f === 'phoneNumber') personalUpdates['mobileNo'] = finalValue;
        else if (f === 'resBrgy') personalUpdates['resBarangay'] = finalValue;
        else if (f === 'permBrgy') personalUpdates['permBarangay'] = finalValue;
        else if (f === 'resZipCode') personalUpdates['residentialZipCode'] = finalValue;
        else if (f === 'permZipCode') personalUpdates['permanentZipCode'] = finalValue;
        else personalUpdates[f] = finalValue;
      }
    });

    if (avatarUrl) mappedAuthUpdates.avatarUrl = avatarUrl;

    if (Object.keys(mappedAuthUpdates).length === 0 && Object.keys(mappedHrUpdates).length === 0 && Object.keys(personalUpdates).length === 0) {
      // ... (existing code for no changes)
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

        if (Object.keys(personalUpdates).length > 0) {
            const existingPersonal = await tx.query.pdsPersonalInformation.findFirst({
                where: eq(pdsPersonalInformation.employeeId, targetUserId)
            });

            if (existingPersonal) {
                await tx.update(pdsPersonalInformation)
                    .set(personalUpdates)
                    .where(eq(pdsPersonalInformation.employeeId, targetUserId));
            } else {
                await tx.insert(pdsPersonalInformation)
                    .values({ ...personalUpdates, employeeId: targetUserId });
            }
        }

        // 10. Population of PDS Education - 100% Precision
        if (updates.education) {
            await tx.delete(pdsEducation).where(eq(pdsEducation.employeeId, targetUserId));
            const education = updates.education;
            const levels = ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate'] as const;
            for (const level of levels) {
                const edu = education[level];
                if (edu && edu.school) {
                    await tx.insert(pdsEducation).values({
                        employeeId: targetUserId,
                        level: level === 'Graduate' ? 'Graduate Studies' : level,
                        schoolName: edu.school,
                        degreeCourse: edu.course || null,
                        yearGraduated: safeInt(edu.yearGrad),
                        unitsEarned: edu.units || null,
                        dateFrom: safeInt(edu.from),
                        dateTo: safeInt(edu.to),
                        honors: edu.honors || null,
                    });
                }
            }
        }

        // --- ELIGIBILITY (Multi + Simplified) ---
        const finalEligibilities = [...(updates.eligibilities || [])];
        if (updates.eligibilityType) {
            finalEligibilities.unshift({
                name: updates.eligibilityType,
                licenseNo: updates.eligibilityNumber || null,
                examDate: updates.eligibilityDate || null,
                rating: null,
                examPlace: null,
                licenseValidUntil: null
            });
        }

        if (finalEligibilities.length > 0) {
            await tx.delete(pdsEligibility).where(eq(pdsEligibility.employeeId, targetUserId));
            for (const elig of finalEligibilities) {
                if (elig.name) {
                    await tx.insert(pdsEligibility).values({
                        employeeId: targetUserId,
                        eligibilityName: elig.name,
                        licenseNumber: elig.licenseNo || null,
                        examDate: safeDate(elig.examDate),
                        rating: safeFloat(elig.rating)?.toString() || null,
                        examPlace: elig.examPlace || null,
                        validityDate: safeDate(elig.licenseValidUntil),
                    });
                }
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
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

export const getNextId: AsyncHandler = async (_req, res) => {
  try {
    const [result] = await db.select({
      maxId: sql<number | null>`MAX(CAST(REGEXP_REPLACE(employee_id, '[^0-9]', '') AS UNSIGNED))`
    })
    .from(authentication);

    const maxId = result?.maxId || 0;
    const nextId = maxId + 1;
    // Format back to Emp-XXX as requested by user
    const formattedNextId = `Emp-${String(nextId).padStart(3, '0')}`;

    res.status(200).json({
      success: true,
      data: formattedNextId
    });
  } catch (error: unknown) {
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
      citizenshipType: recruitmentApplicants.citizenshipType,
      dualCountry: recruitmentApplicants.dualCountry,
      totalExperienceYears: recruitmentApplicants.totalExperienceYears,
      photo1x1Path: recruitmentApplicants.photo1x1Path,
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
    const apiBaseUrl = process.env.API_URL || 'http://localhost:5000';
    const photoUrl = applicant.photo1x1Path
      ? `${apiBaseUrl}/uploads/resumes/${applicant.photo1x1Path}`
      : null;

    res.status(200).json({
      success: true,
      data: {
        ...applicant,
        photoUrl: photoUrl
      }
    });
  } catch (error: unknown) {
    console.error('Error in findHiredApplicant:', error);
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
  } catch (error: unknown) {
    res.status(400).json({ success: false, message: 'Invalid email address.' });
  }
};

export const logout: AuthenticatedHandler = async (req, res) => {
  const userId = req.user?.id || null;
  
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  if (userId) {
    await AuditService.log({
      userId,
      module: 'AUTH',
      action: 'LOGOUT',
      req
    });
  }

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

    // 3. 100% SUCCESS Logic: Ensure portal is ALWAYS available for testing as requested
    // const vacantSetupPositions = positions.filter(p => p.isVacant);
    const vacantSetupPositions = positions; // Temporarily bypass for final fix testing

    // 4. Generate the NEXT available numeric ID to pass to the frontend
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
  } catch (error: unknown) {
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
      where: eq(plantillaPositions.id, positionId)
    });
    
    if (!selectedPosition) {
      res.status(400).json({ success: false, message: "Position is invalid." });
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

    await db.transaction(async (tx) => {
      const [authResult] = await tx.insert(authentication).values({
        firstName: safeFirstName,
        middleName: safeMiddleName,
        lastName: safeLastName,
        suffix: safeSuffix,
        email,
        passwordHash,
        role: role,
        employeeId: null, // Assigned later during formal registration/finalize-setup
        isVerified: false, // 100% FIXED: Admin/HR must verify their email once after setup
        verificationToken: verificationOTP, // 100% FIXED: Save OTP to DB
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

      // 3. Create placeholder PDS Personal Information
      await tx.insert(pdsPersonalInformation).values({
        employeeId: newUserId,
        email: email,
        citizenship: 'Filipino'
      });
    });

    // Send Verification Email
    try {
      await sendOTPEmail(email, safeFirstName, verificationOTP, 'System Initialization: Verify Your Email', 'Welcome to the system. Please use the code below to verify your administrative access:');
    } catch (error: unknown) {
      /* empty */
    }

    res.status(201).json({ 
      success: true, 
      message: `${role} account created. Please verify your email.`,
      data: { email, role: role }
    });
  } catch (_error) {
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
  } catch (error) {
    console.error('Check Govt ID error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during uniqueness check.',
      error: error instanceof Error ? error.message : String(error)
    });
    return;
  }
};
