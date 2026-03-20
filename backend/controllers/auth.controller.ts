import { Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import { authentication, bioEnrolledUsers, schedules, recruitmentApplicants, departments, plantillaPositions, recruitmentJobs, shiftTemplates } from '../db/schema.js';
import { eq, or, and, sql, gt, getTableColumns, desc, InferSelectModel } from 'drizzle-orm';
import { AuthService } from '../services/auth.service.js';
import { checkSystemWideUniqueness } from '../services/validationService.js';
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
  GoogleLoginSchema,
  UpdateProfileSchema,
  SetupPortalSchema
} from '../schemas/authSchema.js';
import { UserRole, EmploymentStatus } from '../types/index.js';
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
type UserWithRelations = InferSelectModel<typeof authentication> & {
  department?: { id: number; name: string } | string | null;
  plantillaPosition?: { positionTitle: string | null } | null;
  pdsEducations?: { schoolName: string | null }[] | null;
  duties?: string;
  shift?: string;
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

  // Handle department as either a string (from table column) or object (from relation)
  let departmentName: string | null = null;
  if (typeof user.department === 'string') {
    departmentName = user.department;
  } else if (user.department && typeof user.department === 'object') {
    const deptObj = user.department as { id: number; name: string };
    departmentName = deptObj.name;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName,
    suffix: user.suffix,
    name: parts.join(' ').trim(),
    role: user.role as UserRole,
    department: departmentName,
    departmentId: user.departmentId,
    employeeId: user.employeeId,
    avatarUrl: user.avatarUrl,
    jobTitle: user.plantillaPosition?.positionTitle || user.jobTitle || null,
    employmentStatus: user.employmentStatus as EmploymentStatus,
    twoFactorEnabled: !!user.twoFactorEnabled,
    dateHired: user.dateHired,
    address: user.address,
    residentialAddress: user.residentialAddress,
    permanentAddress: user.permanentAddress,
    emergencyContact: user.emergencyContact,
    emergencyContactNumber: user.emergencyContactNumber,
    educationalBackground: user.pdsEducations?.[0]?.schoolName || user.educationalBackground || null,
    duties: user.duties || 'Standard Shift',
    shift: user.shift || '08:00 AM - 05:00 PM',
    dutyType: (user.dutyType as string) || 'Standard',
    appointmentType: (user.appointmentType as string) || 'Permanent',
    isVerified: user.isVerified ?? false,
    profileStatus: user.profileStatus || 'Initial',
    
    // Personal Details
    birthDate: user.birthDate,
    gender: user.gender,
    civilStatus: user.civilStatus,
    nationality: user.nationality,
    bloodType: user.bloodType,
    heightM: user.heightM,
    weightKg: user.weightKg,
    mobileNo: user.mobileNo,
    telephoneNo: user.telephoneNo,

    // Government IDs
    gsisNumber: user.gsisNumber,
    pagibigNumber: user.pagibigNumber,
    philhealthNumber: user.philhealthNumber,
    umidNumber: user.umidNumber,
    philsysId: user.philsysId,
    tinNumber: user.tinNumber,
    agencyEmployeeNo: user.agencyEmployeeNo,

    // Section IX: Declarations
    relatedThirdDegree: user.relatedThirdDegree,
    relatedThirdDetails: user.relatedThirdDetails,
    relatedFourthDegree: user.relatedFourthDegree,
    relatedFourthDetails: user.relatedFourthDetails,
    foundGuiltyAdmin: user.foundGuiltyAdmin,
    foundGuiltyDetails: user.foundGuiltyDetails,
    criminallyCharged: user.criminallyCharged,
    dateFiled: user.dateFiled,
    statusOfCase: user.statusOfCase,
    convictedCrime: user.convictedCrime,
    convictedDetails: user.convictedDetails,
    separatedFromService: user.separatedFromService,
    separatedDetails: user.separatedDetails,
    electionCandidate: user.electionCandidate,
    electionDetails: user.electionDetails,
    resignedToPromote: user.resignedToPromote,
    resignedDetails: user.resignedDetails,
    immigrantStatus: user.immigrantStatus,
    immigrantDetails: user.immigrantDetails,
    indigenousMember: user.indigenousMember,
    indigenousDetails: user.indigenousDetails,
    personWithDisability: user.personWithDisability,
    disabilityIdNo: user.disabilityIdNo,
    soloParent: user.soloParent,
    soloParentIdNo: user.soloParentIdNo,

    // Other PDS 2025 Fields
    dualCountry: user.dualCountry,
    govtIdType: user.govtIdType,
    govtIdNo: user.govtIdNo,
    govtIdIssuance: user.govtIdIssuance,
    isMeycauayan: !!user.isMeycauayan,
    dateAccomplished: user.dateAccomplished,
    pdsQuestions: user.pdsQuestions,
  };
};


// ============================================================================
// Helper Functions
// ============================================================================

// Redundant functions removed — now using shared utils/emailUtils.js

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

    // MANDATORY VERIFICATION CHECK
    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        message: 'Email not verified. Please verify your email first.',
        data: null
      });
      return;
    }

    // CHECK TERMINATION STATUS
    if (user.employmentStatus === 'Terminated') {
      res.status(403).json({
        success: false,
        message: 'Access Denied: Your account has been terminated. Please contact Human Resource.',
        data: null
      });
      return;
    }

    // BIOMETRIC ENFORCEMENT: Check bio_enrolled_users (C# biometric data)
    // BIOMETRIC ENFORCEMENT: Check bio_enrolled_users (C# biometric data)
    const deptName = user.department || '';
      
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
export const verifyEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params as { employeeId: string };
    
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

export const register = async (req: Request & { file?: Express.Multer.File }, res: Response): Promise<void> => {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    const { employeeId, email, password } = validatedData;
    const file = req.file;
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
        gsisNumber: validatedData.gsisNumber,
        eligibilityNumber: validatedData.eligibilityNumber
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
      )
    });

    // Auto-detect finalize mode if the matched user is still in 'Initial' setup state
    // This makes the system resilient if the frontend loses the ?mode=finalize-setup query param
    const effectiveFinalizingSetup = isFinalizingSetup || (existingUser?.profileStatus === 'Initial');

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
    if (effectiveFinalizingSetup && !departmentId && existingUser?.departmentId) {
        departmentId = existingUser.departmentId;
    }

    const userDataValues: typeof authentication.$inferInsert = {
      firstName,
      lastName,
      middleName: validatedData.middleName ? sanitizeInput(validatedData.middleName) : undefined,
      suffix: validatedData.suffix ? sanitizeInput(validatedData.suffix) : undefined,
      email,
      role: assignedRole,
      department: department, 
      departmentId,            
      employeeId: actualEmployeeId,
      passwordHash: hashedPassword,
      isVerified: false, 
      verificationToken: verificationOTP,
      avatarUrl,
      jobTitle: positionTitle,
      positionTitle: positionTitle,
      itemNumber: itemNumber,
      dateHired: validatedData.applicantHiredDate || new Date().toISOString().split('T')[0],
      heightM: (() => {
        if (!validatedData.heightM) return null;
        let h = parseFloat(validatedData.heightM);
        if (isNaN(h)) return null;
        if (h > 10) h = h / 100; // e.g. 150cm becomes 1.50m
        return h.toFixed(2);
      })(),
      weightKg: (() => {
        if (!validatedData.weightKg) return null;
        const w = parseFloat(validatedData.weightKg);
        return isNaN(w) ? null : w.toFixed(2);
      })(),
      birthDate: (validatedData.birthDate || null),
      placeOfBirth: (validatedData.placeOfBirth || null),
      gender: (validatedData.gender ?? null),
      civilStatus: (validatedData.civilStatus ?? null),
      nationality: validatedData.nationality || 'Filipino',
      bloodType: (validatedData.bloodType ?? null),
      pdsQuestions: validatedData.pdsQuestions || null,
      address: validatedData.address || validatedData.residentialAddress || undefined,
      residentialAddress: validatedData.residentialAddress || validatedData.address || undefined,
      residentialZipCode: validatedData.residentialZipCode || undefined,
      permanentAddress: validatedData.permanentAddress || undefined,
      permanentZipCode: validatedData.permanentZipCode || undefined,
      resHouseBlockLot: validatedData.resHouseBlockLot || undefined,
      resStreet: validatedData.resStreet || undefined,
      resSubdivision: validatedData.resSubdivision || undefined,
      resBarangay: validatedData.resBrgy || validatedData.resBarangay || undefined,
      resCity: validatedData.resCity || undefined,
      resProvince: validatedData.resProvince || undefined,
      permHouseBlockLot: validatedData.permHouseBlockLot || undefined,
      permStreet: validatedData.permStreet || undefined,
      permSubdivision: validatedData.permSubdivision || undefined,
      permBarangay: validatedData.permBrgy || validatedData.permBarangay || undefined,
      permCity: validatedData.permCity || undefined,
      permProvince: validatedData.permProvince || undefined,
      mobileNo: validatedData.mobileNo || undefined,
      telephoneNo: validatedData.telephoneNo || undefined,
      emergencyContact: validatedData.emergencyContact || undefined,
      emergencyContactNumber: validatedData.emergencyContactNumber || undefined,
      umidNumber: validatedData.umidNumber || undefined,
      philsysId: validatedData.philsysId || undefined,
      gsisNumber: validatedData.gsisNumber || undefined,
      pagibigNumber: validatedData.pagibigNumber || undefined,
      philhealthNumber: validatedData.philhealthNumber || undefined,
      tinNumber: validatedData.tinNumber || undefined,
      agencyEmployeeNo: validatedData.agencyEmployeeNo || undefined,
      educationalBackground: validatedData.educationalBackground || undefined,
      schoolName: validatedData.schoolName || undefined,
      course: validatedData.course || undefined,
      yearGraduated: validatedData.yearGraduated || undefined,
      yearsOfExperience: validatedData.yearsOfExperience || undefined,
      experience: validatedData.experience || undefined,
      skills: validatedData.skills || undefined,
      eligibilityType: validatedData.eligibilityType || undefined,
      eligibilityNumber: validatedData.eligibilityNumber || undefined,
      eligibilityDate: validatedData.eligibilityDate || undefined,
      facebookUrl: validatedData.facebookUrl || undefined,
      linkedinUrl: validatedData.linkedinUrl || undefined,
      twitterHandle: validatedData.twitterHandle || undefined,
      dutyType: (validatedData.dutyType || 'Standard') as "Standard" | "Irregular",
      appointmentType: (validatedData.appointmentType || 'Permanent') as 'Permanent' | 'Contractual' | 'Casual' | 'Job Order' | 'Coterminous' | 'Temporary' | 'Contract of Service' | 'JO' | 'COS',
      profileStatus: 'Complete' as const,
      employmentStatus: 'Active' as const, 
      isOldEmployee: validatedData.isOldEmployee || false,
      isMeycauayan: (validatedData.isMeycauayan === true),
      dateAccomplished: (validatedData.dateAccomplished || null),
    };

    let newUserId: number;

    if (effectiveFinalizingSetup && existingUser) {
        // UPDATE EXISTING ADMIN/HR
        await db.update(authentication).set(userDataValues).where(eq(authentication.id, existingUser.id));
        newUserId = existingUser.id;

        // Allocate default credits and schedules for the finalized admin
        await allocateDefaultCredits(actualEmployeeId);
    } else {
        // INSERT NEW USER
        const [insertResult] = await db.insert(authentication).values(userDataValues);
        newUserId = insertResult.insertId;
        
        // Initial leave allocation for brand new users
        await allocateDefaultCredits(actualEmployeeId);
    }

    // Allocate Standard Schedule for all newly registered or finalized users
    const startDate = userDataValues.dateHired || new Date().toISOString().split('T')[0];
    
    // FETCH THE SYSTEM DEFAULT SHIFT TEMPLATE (Dynamic Solution)
    const [defaultShift] = await db.select()
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
      await db.insert(schedules).values(scheduleValues);
    }

    // Update position status if linked
    if (positionId) {
      await db.update(plantillaPositions)
        .set({ 
          isVacant: false, 
          incumbentId: newUserId,
          filledDate: new Date().toISOString().split('T')[0]
        })
        .where(eq(plantillaPositions.id, positionId));
    }

    // 11. Send Verification Email (SKIP IF ALREADY VERIFIED, e.g. Admin/HR who verified after setup-portal)
    if (!userDataValues.isVerified) {
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
  } catch (_err) {

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
  } catch (_error) {

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

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
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
    .where(eq(authentication.id, userId as number));

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: mapToAuthUser(user)
      }
    });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = LoginSchema.parse(req.body);
    console.log(`[LOGIN DEBUG] Attempt for: "${identifier}"`);
    console.log(`[LOGIN DEBUG] Normalized Lower: "${identifier.toLowerCase()}"`);
    
    let user;
    try {
        user = await AuthService.findUserByIdentifier(identifier);
        console.log(`[LOGIN DEBUG] User found: ${!!user}${user ? ` (ID: ${user.id}, Role: ${user.role})` : ''}`);
    } catch (dbErr: any) {
        console.error(`[LOGIN ERROR] AuthService.findUserByIdentifier failed!`);
        console.error(`[LOGIN ERROR] Message: ${dbErr.message}`);
        if (dbErr.sql) console.error(`[LOGIN ERROR] SQL: ${dbErr.sql}`);
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
    if (user.employmentStatus === 'Terminated') {

      res.status(403).json({
        success: false,
        message: 'access denied: your account has been terminated. please contact human resource.',
        data: null
      });
      return;
    }

    // BIOMETRIC ENFORCEMENT: Check bio_enrolled_users (C# biometric data)
    const deptName = user.department || '';
      
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
        department: user.department,
        employeeId: user.employeeId
      }
    });
  } catch (_err) {

    res.status(500).json({ success: false, message: 'Verification failed.' });
  }
};

export const enableTwoFactor = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
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

export const disableTwoFactor = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
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
  } catch (_err) {

    res.status(500).json({ success: false, message: 'Failed to resend OTP.' });
  }
};

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await db.select({
      id: authentication.id,
      employeeId: authentication.employeeId,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      email: authentication.email,
      department: authentication.department,
      positionTitle: authentication.positionTitle,
      jobTitle: authentication.jobTitle,
      employmentStatus: authentication.employmentStatus,
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
    }).from(authentication).orderBy(authentication.lastName);

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

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const [user] = await db.select({
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

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.user ? authReq.user.id : null;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Safe Parse Body
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, message: 'Invalid update data', errors: parsed.error.format() });
      return;
    }
    const updates = parsed.data;
    const file = (req as Request & { file?: Express.Multer.File }).file;

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

    // Check System-Wide Uniqueness
    const uniqueErrors = await checkSystemWideUniqueness({
        email: updates.email && updates.email !== currentUser.email ? updates.email : undefined,
        umidNumber: updates.umidNumber,
        philsysId: updates.philsysId,
        philhealthNumber: updates.philhealthNumber,
        pagibigNumber: updates.pagibigNumber,
        tinNumber: updates.tinNumber,
        gsisNumber: updates.gsisNumber,
        excludeAuthId: userId
    });

    if (Object.keys(uniqueErrors).length > 0) {
        res.status(409).json({ success: false, message: 'Uniqueness validation failed.', errors: uniqueErrors });
        return;
    }

    const mappedUpdates: Partial<typeof authentication.$inferInsert> = {};
    if (updates.firstName) mappedUpdates.firstName = String(updates.firstName);
    if (updates.lastName) mappedUpdates.lastName = String(updates.lastName);
    if (updates.middleName) mappedUpdates.middleName = String(updates.middleName);
    if (updates.suffix !== undefined) mappedUpdates.suffix = String(updates.suffix);
    
    // Only reset verification if email CHANGED
    if (updates.email && updates.email !== currentUser.email) {
      mappedUpdates.email = String(updates.email);
      
      // Determine if verification is required (Admins/HR might be exempt depending on policy, 
      // but for employees it MUST be mandatory as per requirements)
      const userToUpdate = await db.query.authentication.findFirst({
          where: eq(authentication.id, userId),
          columns: { role: true, firstName: true }
      });
      
      const isEmployee = userToUpdate?.role !== 'Administrator' && userToUpdate?.role !== 'Human Resource';
      
      if (isEmployee) {
          const verificationOTP = generateOTP();
          mappedUpdates.isVerified = false;
          mappedUpdates.verificationToken = verificationOTP;
          
          // Send verification email
          try {
              await sendOTPEmail(
                  String(updates.email), 
                  userToUpdate?.firstName || 'User', 
                  verificationOTP, 
                  'Email Change Verification', 
                  'You have updated your email address. Please use the code below to verify your new email:'
              );
          } catch (_e) {
              console.error('[UPDATE PROFILE] Failed to send verification email');
          }
      } else {
          // Admins/HR still get reset for security, but might not be forced if we want to be lenient
          // However, consistency is better. Let's force it for everyone for 100% integrity.
          const verificationOTP = generateOTP();
          mappedUpdates.isVerified = false;
          mappedUpdates.verificationToken = verificationOTP;
          
          try {
              await sendOTPEmail(
                  String(updates.email), 
                  userToUpdate?.firstName || 'User', 
                  verificationOTP, 
                  'Email Change Verification', 
                  'Security Alert: Your email address has been changed. Please verify to maintain access:'
              );
          } catch (_e) { /* empty */ }
      }
    }

    if (updates.phoneNumber !== undefined) mappedUpdates.mobileNo = String(updates.phoneNumber);
    if (updates.mobileNo !== undefined) mappedUpdates.mobileNo = String(updates.mobileNo);
    if (updates.telephoneNo !== undefined) mappedUpdates.telephoneNo = String(updates.telephoneNo);
    if (updates.birthDate !== undefined) {
        mappedUpdates.birthDate = String(updates.birthDate);
    }
    if (updates.placeOfBirth !== undefined) mappedUpdates.placeOfBirth = String(updates.placeOfBirth);
    if (updates.gender !== undefined) mappedUpdates.gender = updates.gender as "Male" | "Female";
    if (updates.civilStatus !== undefined) mappedUpdates.civilStatus = updates.civilStatus as "Single" | "Married" | "Widowed" | "Separated" | "Annulled";
    if (updates.nationality !== undefined) mappedUpdates.nationality = String(updates.nationality);
    
    if (updates.address !== undefined) mappedUpdates.address = String(updates.address);
    if (updates.residentialAddress !== undefined) mappedUpdates.residentialAddress = String(updates.residentialAddress);
    if (updates.residentialZipCode !== undefined) mappedUpdates.residentialZipCode = String(updates.residentialZipCode);
    if (updates.permanentAddress !== undefined) mappedUpdates.permanentAddress = String(updates.permanentAddress);
    if (updates.permanentZipCode !== undefined) mappedUpdates.permanentZipCode = String(updates.permanentZipCode);

    // Atomic Address Fields
    if (updates.resHouseBlockLot !== undefined) mappedUpdates.resHouseBlockLot = String(updates.resHouseBlockLot);
    if (updates.resStreet !== undefined) mappedUpdates.resStreet = String(updates.resStreet);
    if (updates.resSubdivision !== undefined) mappedUpdates.resSubdivision = String(updates.resSubdivision);
    if (updates.resBarangay !== undefined) mappedUpdates.resBarangay = String(updates.resBarangay);
    if (updates.resCity !== undefined) mappedUpdates.resCity = String(updates.resCity);
    if (updates.resProvince !== undefined) mappedUpdates.resProvince = String(updates.resProvince);
    
    if (updates.permHouseBlockLot !== undefined) mappedUpdates.permHouseBlockLot = String(updates.permHouseBlockLot);
    if (updates.permStreet !== undefined) mappedUpdates.permStreet = String(updates.permStreet);
    if (updates.permSubdivision !== undefined) mappedUpdates.permSubdivision = String(updates.permSubdivision);
    if (updates.permBarangay !== undefined) mappedUpdates.permBarangay = String(updates.permBarangay);
    if (updates.permCity !== undefined) mappedUpdates.permCity = String(updates.permCity);
    if (updates.permProvince !== undefined) mappedUpdates.permProvince = String(updates.permProvince);
    
    if (updates.emergencyContact !== undefined) mappedUpdates.emergencyContact = String(updates.emergencyContact);
    if (updates.emergencyContactNumber !== undefined) mappedUpdates.emergencyContactNumber = String(updates.emergencyContactNumber);

    if (updates.umidNumber !== undefined) mappedUpdates.umidNumber = String(updates.umidNumber);
    if (updates.philsysId !== undefined) mappedUpdates.philsysId = String(updates.philsysId);
    if (updates.gsisNumber !== undefined) mappedUpdates.gsisNumber = String(updates.gsisNumber);
    if (updates.philhealthNumber !== undefined) mappedUpdates.philhealthNumber = String(updates.philhealthNumber);
    if (updates.pagibigNumber !== undefined) mappedUpdates.pagibigNumber = String(updates.pagibigNumber);
    if (updates.tinNumber !== undefined) mappedUpdates.tinNumber = String(updates.tinNumber);
    if (updates.agencyEmployeeNo !== undefined) mappedUpdates.agencyEmployeeNo = String(updates.agencyEmployeeNo);
    
    if (updates.educationalBackground !== undefined) mappedUpdates.educationalBackground = String(updates.educationalBackground);
    if (updates.schoolName !== undefined) mappedUpdates.schoolName = String(updates.schoolName);
    if (updates.course !== undefined) mappedUpdates.course = String(updates.course);
    if (updates.yearGraduated !== undefined) mappedUpdates.yearGraduated = String(updates.yearGraduated);
    if (updates.eligibilityType !== undefined) mappedUpdates.eligibilityType = String(updates.eligibilityType);
    if (updates.eligibilityNumber !== undefined) mappedUpdates.eligibilityNumber = String(updates.eligibilityNumber);
    if (updates.eligibilityDate !== undefined) mappedUpdates.eligibilityDate = String(updates.eligibilityDate);
    if (updates.yearsOfExperience !== undefined) mappedUpdates.yearsOfExperience = String(updates.yearsOfExperience);
    
    if (updates.bloodType !== undefined) mappedUpdates.bloodType = String(updates.bloodType);
    if (updates.heightM !== undefined) mappedUpdates.heightM = String(updates.heightM);
    if (updates.weightKg !== undefined) mappedUpdates.weightKg = String(updates.weightKg);
    
    if (updates.facebookUrl !== undefined) mappedUpdates.facebookUrl = String(updates.facebookUrl);
    if (updates.linkedinUrl !== undefined) mappedUpdates.linkedinUrl = String(updates.linkedinUrl);
    if (updates.twitterHandle !== undefined) mappedUpdates.twitterHandle = String(updates.twitterHandle);
    
    if (updates.positionTitle !== undefined) mappedUpdates.positionTitle = String(updates.positionTitle);
    if (updates.itemNumber !== undefined) mappedUpdates.itemNumber = String(updates.itemNumber);
    if (updates.salaryGrade !== undefined) mappedUpdates.salaryGrade = String(updates.salaryGrade);
    if (updates.stepIncrement !== undefined) mappedUpdates.stepIncrement = Number(updates.stepIncrement);
    if (updates.appointmentType !== undefined) mappedUpdates.appointmentType = updates.appointmentType as 'Permanent' | 'Contractual' | 'Casual' | 'Job Order' | 'Coterminous' | 'Temporary';
    if (updates.employmentStatus !== undefined) mappedUpdates.employmentStatus = updates.employmentStatus as 'Active' | 'Probationary' | 'Terminated' | 'Resigned' | 'On Leave' | 'Suspended' | 'Verbal Warning' | 'Written Warning' | 'Show Cause';
    if (updates.station !== undefined) mappedUpdates.station = String(updates.station);
    if (updates.officeAddress !== undefined) mappedUpdates.officeAddress = String(updates.officeAddress);
    if (updates.dateHired !== undefined) mappedUpdates.dateHired = String(updates.dateHired);
    if (updates.originalAppointmentDate !== undefined) mappedUpdates.originalAppointmentDate = String(updates.originalAppointmentDate);
    if (updates.lastPromotionDate !== undefined) mappedUpdates.lastPromotionDate = String(updates.lastPromotionDate);

    // Section IX: Declarations
    if (updates.relatedThirdDegree !== undefined) mappedUpdates.relatedThirdDegree = String(updates.relatedThirdDegree);
    if (updates.relatedThirdDetails !== undefined) mappedUpdates.relatedThirdDetails = String(updates.relatedThirdDetails);
    if (updates.relatedFourthDegree !== undefined) mappedUpdates.relatedFourthDegree = String(updates.relatedFourthDegree);
    if (updates.relatedFourthDetails !== undefined) mappedUpdates.relatedFourthDetails = String(updates.relatedFourthDetails);
    if (updates.foundGuiltyAdmin !== undefined) mappedUpdates.foundGuiltyAdmin = String(updates.foundGuiltyAdmin);
    if (updates.foundGuiltyDetails !== undefined) mappedUpdates.foundGuiltyDetails = String(updates.foundGuiltyDetails);
    if (updates.criminallyCharged !== undefined) mappedUpdates.criminallyCharged = String(updates.criminallyCharged);
    if (updates.dateFiled !== undefined) mappedUpdates.dateFiled = String(updates.dateFiled);
    if (updates.statusOfCase !== undefined) mappedUpdates.statusOfCase = String(updates.statusOfCase);
    if (updates.convictedCrime !== undefined) mappedUpdates.convictedCrime = String(updates.convictedCrime);
    if (updates.convictedDetails !== undefined) mappedUpdates.convictedDetails = String(updates.convictedDetails);
    if (updates.separatedFromService !== undefined) mappedUpdates.separatedFromService = String(updates.separatedFromService);
    if (updates.separatedDetails !== undefined) mappedUpdates.separatedDetails = String(updates.separatedDetails);
    if (updates.electionCandidate !== undefined) mappedUpdates.electionCandidate = String(updates.electionCandidate);
    if (updates.electionDetails !== undefined) mappedUpdates.electionDetails = String(updates.electionDetails);
    if (updates.resignedToPromote !== undefined) mappedUpdates.resignedToPromote = String(updates.resignedToPromote);
    if (updates.resignedDetails !== undefined) mappedUpdates.resignedDetails = String(updates.resignedDetails);
    if (updates.immigrantStatus !== undefined) mappedUpdates.immigrantStatus = String(updates.immigrantStatus);
    if (updates.immigrantDetails !== undefined) mappedUpdates.immigrantDetails = String(updates.immigrantDetails);
    if (updates.indigenousMember !== undefined) mappedUpdates.indigenousMember = String(updates.indigenousMember);
    if (updates.indigenousDetails !== undefined) mappedUpdates.indigenousDetails = String(updates.indigenousDetails);
    if (updates.personWithDisability !== undefined) mappedUpdates.personWithDisability = String(updates.personWithDisability);
    if (updates.disabilityIdNo !== undefined) mappedUpdates.disabilityIdNo = String(updates.disabilityIdNo);
    if (updates.soloParent !== undefined) mappedUpdates.soloParent = String(updates.soloParent);
    if (updates.soloParentIdNo !== undefined) mappedUpdates.soloParentIdNo = String(updates.soloParentIdNo);

    // Other PDS 2025 Fields
    if (updates.dualCountry !== undefined) mappedUpdates.dualCountry = String(updates.dualCountry);
    if (updates.govtIdType !== undefined) mappedUpdates.govtIdType = String(updates.govtIdType);
    if (updates.govtIdNo !== undefined) mappedUpdates.govtIdNo = String(updates.govtIdNo);
    if (updates.govtIdIssuance !== undefined) mappedUpdates.govtIdIssuance = String(updates.govtIdIssuance);
    
    // NEW PDS 2025 FIELDS
    if (updates.isMeycauayan !== undefined) mappedUpdates.isMeycauayan = !!updates.isMeycauayan;
    if (updates.dateAccomplished !== undefined) mappedUpdates.dateAccomplished = updates.dateAccomplished ? String(updates.dateAccomplished) : null;
    if (updates.pdsQuestions !== undefined) mappedUpdates.pdsQuestions = updates.pdsQuestions || null;

    if (avatarUrl) mappedUpdates.avatarUrl = avatarUrl;

    if (Object.keys(mappedUpdates).length === 0) {
      // If no changes, still return success to avoid frontend error states
      // but fetch the current user to return their data
      const [user] = await db.select({
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

      res.json({
        success: true,
        message: 'No changes detected',
        data: mapToAuthUser(user as UserWithRelations)
      });
      return;
    }

    await db.update(authentication)
      .set(mappedUpdates)
      .where(eq(authentication.id, userId));

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
    .where(eq(authentication.id, userId));

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: mapToAuthUser(updatedUser as UserWithRelations)
    });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

export const getNextId = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await db.execute(sql`
      SELECT MAX(CAST(SUBSTRING(employee_id, 5) AS UNSIGNED)) as maxId
      FROM authentication
      WHERE employee_id LIKE 'Emp-%'
    `);

    interface MaxIdResult {
      maxId: number | string | null;
    }

    const rows = (result[0] as unknown) as MaxIdResult[];
    const maxId = Number(rows[0]?.maxId || 0);
    const nextId = maxId + 1;
    const formattedNextId = `Emp-${String(nextId).padStart(3, '0')}`;

    res.status(200).json({
      success: true,
      data: formattedNextId
    });
  } catch (_error) {

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
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to search for applicant' });
  }
};

export const checkEmailUniqueness = async (req: Request, res: Response): Promise<void> => {
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
  } catch (_error) {
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

export const getSetupPositions = async (_req: Request, res: Response): Promise<void> => {
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
  } catch (_error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const setupPortal = async (req: Request, res: Response): Promise<void> => {
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
    const newEmployeeId = null;

    const [authResult] = await db.insert(authentication).values({
      firstName: safeFirstName,
      middleName: safeMiddleName,
      lastName: safeLastName,
      suffix: safeSuffix,
      email,
      employeeId: newEmployeeId,
      passwordHash,
      role: role as UserRole,
      department: hrDept.name,
      departmentId: hrDept.id,
      positionId: selectedPosition.id,
      jobTitle: selectedPosition.itemNumber 
        ? `${selectedPosition.positionTitle} (${selectedPosition.itemNumber})`
        : selectedPosition.positionTitle,
      salaryGrade: String(selectedPosition.salaryGrade),
      stepIncrement: selectedPosition.stepIncrement ?? 1,
      dutyType: dutyType as "Standard" | "Irregular",
      appointmentType: appointmentType as 'Permanent' | 'Contractual' | 'Casual' | 'Job Order' | 'Coterminous' | 'Temporary' | 'Contract of Service' | 'JO' | 'COS',
      employmentStatus: 'Active',
      profileStatus: 'Initial',
      isVerified: true, // System initiators (Admin/HR) from Setup Portal are pre-verified
      verificationToken: null,
      firstDayOfService: new Date().toISOString().split('T')[0]
    });

    const newUserId = authResult.insertId;

    // Update position status
    await db.update(plantillaPositions)
      .set({ 
        isVacant: false, 
        incumbentId: newUserId,
        filledDate: new Date().toISOString().split('T')[0]
      })
      .where(eq(plantillaPositions.id, selectedPosition.id));

    // Send Verification Email
    try {
      await sendOTPEmail(email, safeFirstName, verificationOTP, 'System Initialization: Verify Your Email', 'Welcome to the system. Please use the code below to verify your administrative access:');
    } catch (_emailErr) {
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
export const checkGovtIdUniqueness = async (req: Request, res: Response) => {
  try {
    const { 
      umidNumber, 
      philsysId, 
      philhealthNumber, 
      pagibigNumber, 
      tinNumber, 
      gsisNumber,
      eligibilityNumber,
      excludeAuthId,
      excludeApplicantId
    } = req.query;

    const errors = await checkSystemWideUniqueness({
      umidNumber: umidNumber as string,
      philsysId: philsysId as string,
      philhealthNumber: philhealthNumber as string,
      pagibigNumber: pagibigNumber as string,
      tinNumber: tinNumber as string,
      gsisNumber: gsisNumber as string,
      eligibilityNumber: eligibilityNumber as string,
      excludeAuthId: excludeAuthId ? Number(excludeAuthId) : undefined,
      excludeApplicantId: excludeApplicantId ? Number(excludeApplicantId) : undefined
    });

    if (Object.keys(errors).length > 0) {
      return res.status(409).json({
        success: false,
        isUnique: false,
        message: Object.values(errors)[0],
        conflicts: errors,
        errors: Object.values(errors)
      });
    }

    return res.status(200).json({
      success: true,
      isUnique: true,
      message: 'Government ID is unique and available.'
    });
  } catch (error) {
    console.error('Check Govt ID error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during ID check' 
    });
  }
};
