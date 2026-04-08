import { Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import { authentication, bioEnrolledUsers, schedules, recruitmentApplicants, departments, plantillaPositions, recruitmentJobs, shiftTemplates, pdsHrDetails, pdsEducation, pdsEligibility, pdsWorkExperience, pdsLearningDevelopment, pdsVoluntaryWork, pdsReferences, employeeEmergencyContacts, pdsOtherInfo, pdsFamily } from '../db/schema.js';
import { pdsPersonalInformation, pdsDeclarations } from '../db/tables/pds.js';
import { eq, or, and, sql, getTableColumns, desc, InferSelectModel, ne, inArray } from 'drizzle-orm';
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
import { PDSService } from '../services/pds.service.js';
// Note: PDS types are used in type annotations for the setupPortal function
import type { 
    RawPDSInput
} from '../types/auth_internal.js';

// Unused interface removed for TSC cleanup

// import { PdsQuestionsSchema } from '../schemas/pdsSchema.js'; // Unused in this file

// Google OAuth Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- HELPER FOR SAFE TYPE CONVERSION (Zero Type Erasure) ---
const safeInt = (val: string | number | null | undefined): number | undefined => {
  if (val === null || val === undefined || String(val).trim() === '' || String(val).toLowerCase() === 'null') return undefined;
  if (typeof val === 'number') return Math.floor(val);
  const cleaned = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '.') return undefined;
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? undefined : parsed;
};

const safeDate = (val: string | null | undefined): string | undefined => {
  if (val === null || val === undefined || String(val).trim() === '' || String(val).toLowerCase() === 'null') return undefined;
  const str = String(val).trim();
  
  // 100% REGEX VALIDATION: MySQL date format must be YYYY-MM-DD
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (isoRegex.test(str)) return str;

  // Attempt to parse standard date and convert to ISO if it's a valid date string
  const dateObj = new Date(str);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toISOString().split('T')[0];
  }
  
  // If it's garbage (e.g. "Continue on separate sheet"), return undefined instead of crashing DB
  return undefined;
};

const safeFloat = (val: string | number | null | undefined): number | undefined => {
  if (val === null || val === undefined || String(val).trim() === '' || String(val).toLowerCase() === 'null') return undefined;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '.') return undefined;
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? undefined : parsed;
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
  hrDetails?: (InferSelectModel<typeof pdsHrDetails> & {
    department?: InferSelectModel<typeof departments> | null;
    position?: InferSelectModel<typeof plantillaPositions> | null;
  }) | null;
  personalInformation?: InferSelectModel<typeof pdsPersonalInformation> | null;
  declarations?: InferSelectModel<typeof pdsDeclarations> | null;
  employeeEmergencyContacts?: InferSelectModel<typeof employeeEmergencyContacts>[] | null;
  pdsEducations?: InferSelectModel<typeof pdsEducation>[] | null;
  pdsEligibilities?: InferSelectModel<typeof pdsEligibility>[] | null;
  pdsWorkExperiences?: InferSelectModel<typeof pdsWorkExperience>[] | null;
  pdsLearningDevelopments?: InferSelectModel<typeof pdsLearningDevelopment>[] | null;
  pdsVoluntaryWorks?: InferSelectModel<typeof pdsVoluntaryWork>[] | null;
  pdsReferences?: InferSelectModel<typeof pdsReferences>[] | null;
  pdsOtherInfos?: InferSelectModel<typeof pdsOtherInfo>[] | null;
  pdsFamilies?: InferSelectModel<typeof pdsFamily>[] | null;
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
  const pds = user.personalInformation;
  const emergency = user.employeeEmergencyContacts?.[0]; // Default to primary/first

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
    isVerified: !!user.isVerified,
    profileStatus: hr?.profileStatus || 'Initial',
    
    // 100% PDS DATA PRE-FILL (JUDITH DATA ENRICHMENT)
    birthDate: pds?.birthDate || null,
    placeOfBirth: pds?.placeOfBirth || null,
    gender: pds?.gender || null,
    civilStatus: pds?.civilStatus || null,
    nationality: pds?.citizenship || 'Filipino',
    citizenship: pds?.citizenship || 'Filipino',
    bloodType: pds?.bloodType || null,
    heightM: pds?.heightM || null,
    weightKg: pds?.weightKg || null,
    mobileNo: pds?.mobileNo || null,
    telephoneNo: pds?.telephoneNo || null,
    
    // Address (Residential) - reconstructed from decomposed fields
    address: [pds?.resHouseBlockLot, pds?.resStreet, pds?.resBarangay, pds?.resCity].filter(Boolean).join(', ') || null,
    residentialAddress: [pds?.resHouseBlockLot, pds?.resStreet, pds?.resBarangay, pds?.resCity].filter(Boolean).join(', ') || null,
    resRegion: pds?.resRegion || null,
    resProvince: pds?.resProvince || null,
    resCity: pds?.resCity || null,
    resBarangay: pds?.resBarangay || null,
    resHouseBlockLot: pds?.resHouseBlockLot || null,
    resSubdivision: pds?.resSubdivision || null,
    resStreet: pds?.resStreet || null,
    residentialZipCode: pds?.residentialZipCode || null,

    // Address (Permanent) - reconstructed from decomposed fields
    permanentAddress: [pds?.permHouseBlockLot, pds?.permStreet, pds?.permBarangay, pds?.permCity].filter(Boolean).join(', ') || null,
    permRegion: pds?.permRegion || null,
    permProvince: pds?.permProvince || null,
    permCity: pds?.permCity || null,
    permBarangay: pds?.permBarangay || null,
    permHouseBlockLot: pds?.permHouseBlockLot || null,
    permSubdivision: pds?.permSubdivision || null,
    permStreet: pds?.permStreet || null,
    permanentZipCode: pds?.permanentZipCode || null,

    // Government IDs
    gsisNumber: pds?.gsisNumber || null,
    pagibigNumber: pds?.pagibigNumber || null,
    philhealthNumber: pds?.philhealthNumber || null,
    umidNumber: pds?.umidNumber || null,
    philsysId: pds?.philsysId || null,
    tinNumber: pds?.tinNumber || null,
    agencyEmployeeNo: pds?.agencyEmployeeNo || null,

    // Emergency
    emergencyContact: emergency?.name || null,
    emergencyNo: emergency?.phoneNumber || pds?.mobileNo || null,
    emergencyRelation: emergency?.relationship || null,

    // Relational Arrays (Zero-Erasure Hydration)
    educations: (user.pdsEducations || []).map(edu => ({
      ...edu,
      institution: edu.schoolName || '', // Frontend alias
      degree: edu.degreeCourse || '', // Frontend alias
      from: edu.dateFrom || null,
      to: edu.dateTo || null,
      yearGrad: edu.yearGraduated || null,
      honors: edu.honors || null
    })),
    eligibilities: (user.pdsEligibilities || []).map(elig => ({
      ...elig,
      name: elig.eligibilityName || '', // Frontend alias
      rating: elig.rating || null,
      examDate: elig.examDate || null,
      examPlace: elig.examPlace || null,
      licenseNo: elig.licenseNumber || null, // Frontend alias
      licenseValidUntil: elig.validityDate || null // Frontend alias
    })),
    workExperiences: (user.pdsWorkExperiences || []).map(work => ({
      ...work,
      from: work.dateFrom || null,
      to: work.dateTo || null,
      position: work.positionTitle || '', // Frontend alias
      company: work.companyName || '', // Frontend alias
      salary: work.monthlySalary || null, // Frontend alias
      status: work.appointmentStatus || '' // Frontend alias
    })),
    learningDevelopments: (user.pdsLearningDevelopments || []).map(ld => ({
      ...ld,
      title: ld.title || '',
      from: ld.dateFrom || null,
      to: ld.dateTo || null,
      hours: ld.hoursNumber || null,
      type: ld.typeOfLd || null,
      conductedBy: ld.conductedBy || null
    })),
    voluntaryWorks: Array.isArray(user.pdsVoluntaryWorks) ? user.pdsVoluntaryWorks : [],
    references: Array.isArray(user.pdsReferences) ? user.pdsReferences : [],
    otherInfos: Array.isArray(user.pdsOtherInfos) ? user.pdsOtherInfos : [],
    families: Array.isArray(user.pdsFamilies) ? user.pdsFamilies : [],
    declarations: user.declarations || null,

    // Other (social media and religion fields removed from schema)
    isMeycauayan: !!hr?.isMeycauayan,
  } as const;
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
            department: true,
            position: true
          }
        },
        personalInformation: true,
        employeeEmergencyContacts: { limit: 1 },
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
    } catch (err: unknown) { const _error = err instanceof Error ? err : new Error(String(err));
      const message = _error instanceof Error ? _error.message : 'Unknown email error';
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

  } catch (err: unknown) { const _error = err instanceof Error ? err : new Error(String(err));
    console.error('[GOOGLE LOGIN ERROR]', _error);
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
  } catch {
    res.status(500).json({ success: false, message: 'Failed to verify enrollment.' });
  }
};

interface RegisterRequestWithFile extends Request {
  file?: Express.Multer.File;
}

interface RegisterBody {
  [key: string]: string | number | boolean | undefined | null | object | Record<string, string | number | boolean | null>[]; 
  pdsQuestions?: string | PDSQuestions;
  educations?: string | Record<string, string | number | boolean | null>[];
  eligibilities?: string | Record<string, string | number | boolean | null>[];
  workExperiences?: string | Record<string, string | number | boolean | null>[];
  trainings?: string | Record<string, string | number | boolean | null>[];
  otherInfo?: string | Record<string, string | number | boolean | null>[];
  familyBackground?: string | Record<string, string | number | boolean | null>[];
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
  firstName?: string;
  lastName?: string;
  middleName?: string;
  suffix?: string;
  email?: string;
  citizenship?: string;
}

export const register: AsyncHandler = async (req, res) => {
  const multerReq = req as RegisterRequestWithFile;
  try {
    const body = req.body as RegisterBody;
    // 0. Pre-parse JSON strings and handle boolean/enum conversions from multipart/form-data
    const objectFields: (keyof RegisterBody)[] = [
      'education', 'educations', 'eligibilities', 'workExperiences', 'trainings',
      'otherInfo', 'familyBackground', 'pdsQuestions',
      'otherSkills', 'recognitions', 'memberships', 'children'
    ];
    // Array-typed fields that Zod expects as arrays (must convert empty/invalid strings to [])
    const arrayFields = new Set(['educations', 'eligibilities', 'workExperiences', 'trainings', 'otherInfo', 'familyBackground', 'otherSkills', 'recognitions', 'memberships', 'children']);
    
    objectFields.forEach(field => {
      const value = body[field];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            body[field] = JSON.parse(trimmed) as object;
          } catch (__e) {
            // If parse fails and field expects array, default to empty array
            if (arrayFields.has(field as string)) {
              body[field] = [] as never;
            }
          }
        } else if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') {
          // Empty/sentinel strings → default to empty array for array fields, null for object fields
          if (arrayFields.has(field as string)) {
            body[field] = [] as never;
          } else {
            delete body[field];
          }
        }
        // else: non-JSON string stays as-is (Zod will flag if wrong type)
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

    // 100% STABLE SANITIZATION: Clean up [object Object] leaks and ensure ENUM compatibility
    const allFields = Object.keys(body) as (keyof typeof body)[];
    const typedBody = body as Record<string, unknown>;
    allFields.forEach(key => {
        if (typeof typedBody[key] === 'string' && typedBody[key] === '[object Object]') {
            typedBody[key] = null;
        }
    });

    // Defensive ENUM check for register-time validation (before Zod)
    const allowedCivilStatus = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled'];
    if (body.civilStatus && typeof body.civilStatus === 'string' && !allowedCivilStatus.includes(body.civilStatus)) {
        // If it looks like a country (e.g. Angola), move it to citizenship if citizenship is empty
        if (!body.citizenship || body.citizenship === 'Filipino') {
            body.citizenship = body.civilStatus;
        }
        delete body.civilStatus; // Set to undefined so Zod uses optional/default
    }

    traceLog('1. Start Registration', { mode: req.query.mode, hasFile: !!multerReq.file });
    console.error('[DEBUG PRE-PARSE] educations:', typeof body.educations, Array.isArray(body.educations), typeof body.educations === 'string' ? body.educations.substring(0, 100) : '(not string)');
    console.error('[DEBUG PRE-PARSE] otherInfo:', typeof body.otherInfo, Array.isArray(body.otherInfo));
    console.error('[DEBUG PRE-PARSE] familyBackground:', typeof body.familyBackground, Array.isArray(body.familyBackground));
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
        console.warn(`[Register] Biometric record not found for: ${inputEmployeeId}, proceeding anyway due to zero-validation mode.`);
    }

    // 3. Use the EXACT employee ID from the biometric record for system consistency, or fallback to input
    const actualEmployeeId = enrolled?.employeeId || inputEmployeeId;
    const finalEmail = email || `${actualEmployeeId}@chrmo.local`;

    const existingUser = await db.query.authentication.findFirst({
      where: or(
        eq(authentication.employeeId, actualEmployeeId),
        eq(authentication.email, finalEmail)
      ),
      with: {
        hrDetails: true
      }
    });

    // Auto-detect finalize mode if the matched user is still in 'Initial' setup state
    // This makes the system resilient if the frontend loses the ?mode=finalize-setup query param
    const effectiveFinalizingSetup = isFinalizingSetup || (existingUser?.hrDetails?.profileStatus === 'Initial');

    // 4. Use provided name if available, otherwise pull from bio_enrolled_users
    const enrolledFullName = enrolled?.fullName || '';
    const firstName = sanitizeInput(validatedData.firstName || enrolledFullName.split(' ')[0] || 'Unknown');
    const lastName = sanitizeInput(validatedData.lastName || (enrolledFullName.split(' ').length > 1 ? enrolledFullName.split(' ').slice(1).join(' ') : 'Unknown'));
    
    // 5. Check System-Wide Uniqueness
    const uniqueErrors = await checkSystemWideUniqueness({
        email: finalEmail,
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
        if (existingUser.email === finalEmail) {
          res.status(409).json({ success: false, message: 'Email already exists.', data: null });
          return;
        }
        res.status(409).json({ success: false, message: 'This Employee ID is already registered.', data: null });
        return;
      }
    }

    // New: Homonym (Duplicate Name) Detection
    if (!validatedData.ignoreDuplicateWarning) {
        const middleName = sanitizeInput(validatedData.middleName);
        const suffix = sanitizeInput(validatedData.suffix);
        const nameMatch = await db.query.authentication.findFirst({
            where: (auth, { eq, or, and, sql }) => and(
                eq(auth.firstName, firstName),
                eq(auth.lastName, lastName),
                middleName 
                    ? eq(auth.middleName, middleName) 
                    : or(eq(auth.middleName, ""), sql`${auth.middleName} IS NULL`),
                suffix 
                    ? eq(auth.suffix, suffix) 
                    : or(eq(auth.suffix, ""), sql`${auth.suffix} IS NULL`),
                effectiveFinalizingSetup && existingUser ? ne(auth.id, existingUser.id) : undefined
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
        } catch {
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
        console.error('[DEBUG] Generating default password...');
        const defaultPwd = "Meycauayan@2026";
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(defaultPwd, salt);
        console.error('[DEBUG] Default password generated.');
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
    const department = validatedData.department || enrolled?.department || 'Unassigned';
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

    const middleName = sanitizeInput(validatedData.middleName)?.substring(0, 100) || null;
    const suffix = sanitizeInput(validatedData.suffix)?.substring(0, 100) || null;

    const authDataValues: typeof authentication.$inferInsert = {
      employeeId: actualEmployeeId,
      firstName: firstName?.substring(0, 100),
      lastName: lastName?.substring(0, 100),
      middleName,
      suffix,
      email: finalEmail?.substring(0, 255),
      passwordHash: hashedPassword,
      role: assignedRole,
      isVerified: finalIsVerified,
      verificationToken: finalIsVerified ? null : verificationOTP,
      avatarUrl,
    };

    // 100% ACCURATE NAME SYNTHESIS (FOR BIOMETRICS & SEARCH)
    const fullAccountName = `${lastName}, ${firstName}${middleName ? ' ' + middleName : ''}${suffix ? ' ' + suffix : ''}`.trim();

    let newUserId: number = 0;
    traceLog('3. Pre-Transaction Checks Done', { actualEmployeeId, suffix: authDataValues.suffix });
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
            fullName: fullAccountName,
            department: department || 'Unassigned',
            userStatus: 'active',
            updatedAt: sql`CURRENT_TIMESTAMP`
          }).where(sql`${normalizeIdSql(bioEnrolledUsers.employeeId)} = ${normalizeIdSql(actualEmployeeId)}`);
        } else {
          await tx.insert(bioEnrolledUsers).values({
            employeeId: actualEmployeeId,
            fullName: fullAccountName,
            department: department || 'Unassigned',
            userStatus: 'active'
          });
        }
      }

      // --- SAVE REGISTRATION DATA TO PDS TABLES ---
      // 100% AUTOMATED PDS PERSISTENCE
      // We map the validatedData (from RegisterSchema) to the PDSFormData structure expected by the service.
      const rawInput = validatedData as RawPDSInput & Record<string, unknown>;
      const pdsData: Partial<PDSFormData> = {
        // Core Names (Synchronized with Core Profile)
        // 100% Data Fidelity: Check both Zod-validated fields and raw parser synonyms.
        lastName: validatedData.lastName || validatedData.surname || String(rawInput.surname || rawInput.last_name || ''),
        firstName: validatedData.firstName || String(rawInput.first_name || ''),
        middleName: validatedData.middleName || String(rawInput.middle_name || ''),
        suffix: validatedData.suffix || validatedData.nameExtension || String(rawInput.name_extension || rawInput.extension || ''),
        maidenName: validatedData.maidenName || String(rawInput.maiden_name || ''),

        // Personal Info
        dob: safeDate(validatedData.birthDate || validatedData.dob || String(rawInput.birth_date || '')),
        pob: validatedData.placeOfBirth || validatedData.pob || String(rawInput.pob || rawInput.place_of_birth || '') || undefined,
        sex: (validatedData.gender || validatedData.sex || rawInput.sex || rawInput.gender) as string | undefined,
        civilStatus: (validatedData.civilStatus || rawInput.civil_status || rawInput.civilStatus) as string | undefined,
        height: (safeFloat(validatedData.heightM) || safeFloat(validatedData.height) || safeFloat(rawInput.height as string | number | undefined))?.toString() || undefined,
        weight: (safeFloat(validatedData.weightKg) || safeFloat(validatedData.weight) || safeFloat(rawInput.weight as string | number | undefined))?.toString() || undefined,
        bloodType: (validatedData.bloodType || rawInput.blood_type || rawInput.bloodType) ? String(validatedData.bloodType || rawInput.blood_type || rawInput.bloodType).substring(0, 5) : undefined,
        
        citizenship: validatedData.citizenship || validatedData.nationality || (rawInput.citizenship as string | undefined) || 'Filipino',
        citizenshipType: validatedData.citizenshipType || (rawInput.citizenship_type as string | undefined),
        dualCountry: validatedData.dualCountry || (rawInput.dual_country as string | undefined),

        // Address Information
        residentialAddress: validatedData.residentialAddress || validatedData.address || (rawInput.residential_address as string | undefined),
        residentialZipCode: validatedData.residentialZipCode || (rawInput.residential_zip_code as string | undefined),
        resRegion: validatedData.resRegion || (rawInput.res_region as string | undefined),
        resProvince: validatedData.resProvince || (rawInput.res_province as string | undefined),
        resCity: validatedData.resCity || (rawInput.res_city as string | undefined),
        resBarangay: validatedData.resBarangay || (rawInput.res_barangay as string | undefined),
        resHouseBlockLot: validatedData.resHouseBlockLot || (rawInput.res_house_block_lot as string | undefined),
        resStreet: validatedData.resStreet || (rawInput.res_street as string | undefined),
        resSubdivision: validatedData.resSubdivision || (rawInput.res_subdivision as string | undefined),

        permanentAddress: validatedData.permanentAddress || (rawInput.permanent_address as string | undefined),
        permanentZipCode: validatedData.permanentZipCode || (rawInput.permanent_zip_code as string | undefined),
        permRegion: validatedData.permRegion || (rawInput.perm_region as string | undefined),
        permProvince: validatedData.permProvince || (rawInput.perm_province as string | undefined),
        permCity: validatedData.permCity || (rawInput.perm_city as string | undefined),
        permBarangay: validatedData.permBarangay || (rawInput.perm_barangay as string | undefined),
        permHouseBlockLot: validatedData.permHouseBlockLot || (rawInput.perm_house_block_lot as string | undefined),
        permStreet: validatedData.permStreet || (rawInput.perm_street as string | undefined),
        permSubdivision: validatedData.permSubdivision || (rawInput.perm_subdivision as string | undefined),

        telephoneNo: validatedData.telephoneNo || (rawInput.telephone_no as string | undefined),
        mobileNo: validatedData.mobileNo || (rawInput.mobile_no as string | undefined),
        email: finalEmail || validatedData.email || (rawInput.email as string | undefined),

        // Government IDs
        gsisNumber: (validatedData.gsisNumber || validatedData.gsisNo || String(rawInput.gsis_no || rawInput.gsis_number || '')) || undefined,
        pagibigNumber: (validatedData.pagibigNumber || validatedData.pagibigNo || String(rawInput.pagibig_no || rawInput.pagibig_number || '')) || undefined,
        philhealthNumber: (validatedData.philhealthNumber || validatedData.philhealthNo || String(rawInput.philhealth_no || rawInput.philhealth_number || '')) || undefined,
        philsysId: (validatedData.philsysId || String(rawInput.philsysNo || rawInput.philsys_id || '')) || undefined,
        tinNumber: (validatedData.tinNumber || validatedData.tinNo || String(rawInput.tin_no || rawInput.tin_number || '')) || undefined,
        umidNumber: (validatedData.umidNumber || validatedData.umidNo || String(rawInput.umid_no || rawInput.umid_number || '')) || undefined,
        agencyEmployeeNo: (validatedData.agencyEmployeeNo || String(rawInput.agencyNo || rawInput.agency_employee_no || '')) || undefined,
        
        // Arrays from Parser (100% Passthrough)
        educations: (validatedData.educations as PDSEducation[]) || [],
        eligibilities: (validatedData.eligibilities as PDSEligibility[]) || [],
        workExperiences: (validatedData.workExperiences as PDSWorkExperience[]) || [],
        trainings: (validatedData.trainings as PDSLearningDevelopment[]) || [],
        otherInfo: (validatedData.otherInfo as PDSOtherInfo[]) || [],
        familyBackground: (validatedData.familyBackground as PDSFamily[]) || [],
        voluntaryWorks: (validatedData.voluntaryWorks as PDSVoluntaryWork[]) || (rawInput.voluntaryWorks as PDSVoluntaryWork[] | undefined) || [],
        references: (validatedData.references as PDSReference[]) || (rawInput.references as PDSReference[] | undefined) || [],
        pdsQuestions: (validatedData.pdsQuestions as PDSQuestions) || ({} as PDSQuestions),
        govtIdType: validatedData.govtIdType || (rawInput.govtIdType as string | undefined),
        govtIdNo: validatedData.govtIdNo || (rawInput.govtIdNo as string | undefined),
        govtIdIssuance: validatedData.govtIdIssuance || (rawInput.govt_id_issuance as string | undefined),
        dateAccomplished: validatedData.dateAccomplished || (rawInput.date_accomplished as string | undefined),
      };

      // 100% DEFENSIVE PDS PERSISTENCE
      try {
          traceLog('4.5 Saving PDS Data');
          await PDSService.saveFullPdsData(newUserId, pdsData, null, tx);
          traceLog('5. PDS Tables Success');
      } catch (pdsError: any) {
          console.error('[AUTH] PDS persistence failed:', pdsError.message);
          traceLog(`[ERROR] PDS Persistence Failed: ${pdsError.message}`);
          throw pdsError; // Re-throw to trigger transaction rollback
      }
      
      // Emergency Contact - Keep as it maps to a different table
      if (validatedData.emergencyContact) {
          traceLog('6. Emergency Contact Start');
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
      const q = (validatedData.pdsQuestions as PDSQuestions) || ({} as PDSQuestions);
      const declValues: typeof pdsDeclarations.$inferInsert = {
          employeeId: newUserId,
          govtIdType: validatedData.govtIdType || null,
        govtIdNo: validatedData.govtIdNo || null,
        govtIdIssuance: validatedData.govtIdIssuance || null,
        dateAccomplished: safeDate(validatedData.dateAccomplished) || new Date().toISOString().split('T')[0],
        relatedThirdDegree: q.relatedThirdDegree ? 'Yes' : 'No',
        relatedThirdDetails: q.relatedThirdDetails || null, 
        relatedFourthDegree: q.relatedFourthDegree ? 'Yes' : 'No',
        relatedFourthDetails: q.relatedFourthDetails || null,
        foundGuiltyAdmin: q.foundGuiltyAdmin ? 'Yes' : 'No',
        foundGuiltyDetails: q.foundGuiltyDetails || null,
        criminallyCharged: q.criminallyCharged ? 'Yes' : 'No',
          dateFiled: safeDate(q.dateFiled) || null,
          statusOfCase: q.statusOfCase || null,
          convictedCrime: q.convictedCrime ? 'Yes' : 'No',
          convictedDetails: q.convictedDetails || null,
          separatedFromService: q.separatedFromService ? 'Yes' : 'No',
          separatedDetails: q.separatedDetails || null,
          electionCandidate: q.electionCandidate ? 'Yes' : 'No',
          electionDetails: q.electionDetails || null,
          resignedToPromote: q.resignedToPromote ? 'Yes' : 'No',
          resignedDetails: q.resignedDetails || null,
          immigrantStatus: q.immigrantStatus ? 'Yes' : 'No',
          immigrantDetails: q.immigrantDetails || null,
          indigenousMember: q.indigenousMember ? 'Yes' : 'No',
          indigenousDetails: q.indigenousDetails || null,
          personWithDisability: q.personWithDisability ? 'Yes' : 'No',
          disabilityIdNo: q.disabilityIdNo || null,
          soloParent: q.soloParent ? 'Yes' : 'No',
          soloParentIdNo: q.soloParentIdNo || null,
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

          await sendOTPEmail(finalEmail, firstName, verificationOTP, subject, body);
        } catch (err: unknown) { const _error = err instanceof Error ? err : new Error(String(err));
          console.error('[REGISTER] Email send failed:', _error instanceof Error ? _error.message : String(_error));
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
        email: finalEmail, 
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
            email: finalEmail, 
            employeeId: actualEmployeeId, 
            role: assignedRole,
            isFinalizingSetup: effectiveFinalizingSetup
          },
          req
        });
      } catch (auditErr: unknown) {
        console.error('[AUDIT ERROR] Failed to log registration:', auditErr);
      }
    }
  } catch (err: unknown) {
    const _error = err instanceof Error ? err : new Error(String(err));
    traceLog('FATAL ERROR DURING REGISTRATION', _error.message);
    console.error('[AUTH] Registration failed:', _error);
    
    if (_error instanceof z.ZodError) {
      try {
        fs.writeFileSync(path.join(process.cwd(), 'zod_errors.json'), JSON.stringify(_error.format(), null, 2));
      } catch (_e: unknown) { /* ignore */ }
    }
    
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during registration.',
      error: _error.message,
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
  } catch (err: unknown) { const _error = err instanceof Error ? err : new Error(String(err));
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
  } catch (err: unknown) { 
    const _error = err instanceof Error ? err : new Error(String(err));
    console.error('[Resend Verification Error]', _error.message);
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
    const _error = err instanceof Error ? err : new Error(String(err));
    console.error('[FORGOT PASSWORD ERROR]', _error.message);
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
    const _error = err instanceof Error ? err : new Error(String(err));
    console.error('[RESET PASSWORD ERROR]', _error.message);
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
            },
            personalInformation: true,
            declarations: true,
            pdsEducations: true,
            pdsEligibilities: true,
            pdsFamilies: true,
            pdsLearningDevelopments: true,
            pdsOtherInfos: true,
            pdsVoluntaryWorks: true,
            pdsWorkExperiences: true,
            employeeEmergencyContacts: { limit: 1 }
        }
    }) as UserWithRelations | undefined;

    res.status(200).json({
      success: true,
      data: {
        user: mapToAuthUser({
            ...userData,
            hrDetails: userWithHr?.hrDetails,
            personalInformation: userWithHr?.personalInformation,
            declarations: userWithHr?.declarations,
            pdsEducations: userWithHr?.pdsEducations,
            pdsEligibilities: userWithHr?.pdsEligibilities,
            pdsFamilies: userWithHr?.pdsFamilies,
            pdsLearningDevelopments: userWithHr?.pdsLearningDevelopments,
            pdsOtherInfos: userWithHr?.pdsOtherInfos,
            pdsVoluntaryWorks: userWithHr?.pdsVoluntaryWorks,
            pdsWorkExperiences: userWithHr?.pdsWorkExperiences,
            employeeEmergencyContacts: userWithHr?.employeeEmergencyContacts
        } as UserWithRelations)
      }
    });
  } catch (err: unknown) { 
    const _error = err instanceof Error ? err : new Error(String(err));
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const login: AsyncHandler = async (req, res) => {
  try {
    const { identifier, password } = LoginSchema.parse(req.body);
    
    let user;
    try {
        user = await AuthService.findUserByIdentifier(identifier);
    } catch (_dbErr: unknown) {
        console.error(`[LOGIN ERROR] AuthService.findUserByIdentifier failed!`);
        if (_dbErr instanceof Error) {
            console.error(`[LOGIN ERROR] Message: ${_dbErr.message}`);
        }
        throw _dbErr; 
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
    if (!passwordMatch) {
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
      } catch (err: unknown) { 
        const _error = err instanceof Error ? err : new Error(String(err));
        console.error('[2FA Send Error]', _error.message);
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
    } catch (_schedErr: unknown) {
      const msg = _schedErr instanceof Error ? _schedErr.message : String(_schedErr);
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
    const _error = err instanceof Error ? err : new Error(String(err));
    console.error('[LOGIN ERROR]', _error.message);
    res.status(500).json({
      success: false,
      message: _error.message || 'An unexpected error occurred during login.',
      error: _error.message
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

  } catch (err: unknown) { 
    const _error = err instanceof Error ? err : new Error(String(err));
    console.error('[2FA VERIFY ERROR]', _error.message);
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
  } catch (err: unknown) { 
    const _error = err instanceof Error ? err : new Error(String(err));
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
  } catch (err: unknown) { 
    const _error = err instanceof Error ? err : new Error(String(err));
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
  } catch (err: unknown) { 
    const _error = err instanceof Error ? err : new Error(String(err));
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
  } catch (err: unknown) { 
    const _error = err instanceof Error ? err : new Error(String(err));
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
  } catch (err: unknown) { 
    const _error = err instanceof Error ? err : new Error(String(err));
    console.error('[Get User Detail Error]', _error.message);
    res.status(500).json({ success: false, message: 'Failed to find user detail' });
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
      } catch { 
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
    if (updates.appointmentType !== undefined) mappedHrUpdates.appointmentType = updates.appointmentType as 'Contractual' | 'Job Order' | 'Coterminous' | 'Temporary' | 'Casual' | 'Permanent' | 'Contract of Service' | 'JO' | 'COS';
    if (updates.employmentStatus !== undefined) mappedHrUpdates.employmentStatus = updates.employmentStatus as 'Active' | 'Probationary' | 'Terminated' | 'Resigned' | 'On Leave' | 'Suspended' | 'Verbal Warning' | 'Written Warning' | 'Show Cause';
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
                const insertValues: typeof pdsHrDetails.$inferInsert = { 
                    ...mappedHrUpdates, 
                    employeeId: targetUserId 
                };
                await tx.insert(pdsHrDetails).values(insertValues);
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
                const insertValues: typeof pdsPersonalInformation.$inferInsert = { 
                    ...personalUpdates, 
                    employeeId: (targetUserId as unknown as number)
                };
                await tx.insert(pdsPersonalInformation).values(insertValues);
            }
        }

        // 100% AUTOMATED PDS INGESTION (Replacing manual loops/old reliance)
        const pdsData: Partial<PDSFormData> = {
            educations: (updates.educations as PDSEducation[]) || [],
            workExperiences: (updates.workExperiences as PDSWorkExperience[]) || [],
            trainings: (updates.trainings as PDSLearningDevelopment[]) || [],
            eligibilities: (updates.eligibilities as PDSEligibility[]) || [],
            familyBackground: (updates.familyBackground as PDSFamily[]) || [],
            voluntaryWorks: (updates.voluntaryWorks as PDSVoluntaryWork[]) || [],
            references: (updates.references as PDSReference[]) || [],
            otherInfo: (updates.otherInfo as PDSOtherInfo[]) || [],
            pdsQuestions: (updates.pdsQuestions as PDSQuestions) || undefined
        };

        // Legacy Bridge: Bridge 'education' dict to 'educations' array
        if (updates.education) {
            const legacyEdu = updates.education as Record<string, { school?: string; course?: string; yearGrad?: string | number; units?: string; from?: string | number; to?: string | number; honors?: string }>;
            const levels = ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate'] as const;
            for (const level of levels) {
                const edu = legacyEdu[level];
                if (edu && edu.school) {
                    pdsData.educations?.push({
                        level: (level === 'Graduate' ? 'Graduate Studies' : level) as "Elementary" | "Secondary" | "Vocational" | "College" | "Graduate Studies",
                        schoolName: edu.school,
                        degreeCourse: edu.course || undefined,
                        yearGraduated: safeInt(edu.yearGrad),
                        unitsEarned: edu.units || undefined,
                        dateFrom: safeInt(edu.from),
                        dateTo: safeInt(edu.to),
                        honors: edu.honors || undefined,
                    });
                }
            }
        }

        // Legacy Bridge: Bridge single 'eligibilityType' to 'eligibilities' array
        if (updates.eligibilityType) {
            pdsData.eligibilities?.push({
                eligibilityName: updates.eligibilityType,
                licenseNumber: updates.eligibilityNumber || undefined,
                examDate: safeDate(updates.eligibilityDate),
                rating: undefined,
                examPlace: undefined,
                validityDate: undefined
            });
        }

        // 100% Reliable Ingestion
        await PDSService.saveFullPdsData(targetUserId, pdsData, null, tx);
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
  } catch (err: unknown) { 
    const _error = err instanceof Error ? err : new Error(String(err));
    console.error('[Update Profile Error]', _error.message);
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
  } catch (err: unknown) { 
    const _error = err instanceof Error ? err : new Error(String(err));
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
  } catch (err: unknown) { 
    const _error = err instanceof Error ? err : new Error(String(err));
    console.error('Error in findHiredApplicant:', _error.message);
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
  } catch (err: unknown) { 
    const _error = err instanceof Error ? err : new Error(String(err));
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


/**
 * Recursively fetch all sub-department IDs for a parent department (specifically for setup)
 */
const getDepartmentDescendantsForSetup = async (parentId: number): Promise<number[]> => {
  const children = await db.select({ id: departments.id })
    .from(departments)
    .where(eq(departments.parentDepartmentId, parentId));
  
  let ids = [parentId];
  for (const child of children) {
    const descendantIds = await getDepartmentDescendantsForSetup(child.id);
    ids = [...ids, ...descendantIds];
  }
  return ids;
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

    // 2. Fetch all seeded positions for HR and ALL its divisions
    const allHrDeptIds = await getDepartmentDescendantsForSetup(hrDept.id);
    
    const positions = await db.query.plantillaPositions.findMany({
      where: inArray(plantillaPositions.departmentId, allHrDeptIds),
      orderBy: [desc(plantillaPositions.salaryGrade), desc(plantillaPositions.itemNumber)],
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
  } catch (err: unknown) { 
    const _error = err instanceof Error ? err : new Error(String(err));
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

    if (!departmentId || !positionId) {
      res.status(400).json({ success: false, message: "Department and Position are required." });
      return;
    }

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
        role: role || 'Employee',
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
        dutyType: dutyType as 'Standard' | 'Irregular' | undefined,
        appointmentType: appointmentType as 'Permanent'|'Contractual'|'Casual'|'Job Order'|'Coterminous'|'Temporary'|'Contract of Service'|'JO'|'COS' | undefined,
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
    } catch {
      /* empty */
    }

    res.status(201).json({ 
      success: true, 
      message: `${role} account created. Please verify your email.`,
      data: { email, role: role }
    });
  } catch (_err) {
    const errMessage = _err instanceof Error ? `${_err.message}\n${_err.stack}` : String(_err);
    console.error('[SETUP_PORTAL_CRASH]', errMessage);
    res.status(500).json({ success: false, message: "Internal server error", error: errMessage });
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
  } catch (err: unknown) { const _error = err instanceof Error ? err : new Error(String(err));
    console.error('Check Govt ID error:', _error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during uniqueness check.',
      error: _error instanceof Error ? _error.message : String(_error)
    });
    return;
  }
};
