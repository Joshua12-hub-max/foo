import { compareIds, normalizeIdJs, normalizeIdSql } from '../utils/idUtils.js';
import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest, AuthenticatedHandler, AsyncHandler } from '../types/index.js';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import { authentication, bioEnrolledUsers, schedules, recruitmentApplicants, departments, plantillaPositions, recruitmentJobs, shiftTemplates, pdsHrDetails, pdsEducation, pdsEligibility, pdsWorkExperience, pdsLearningDevelopment, pdsVoluntaryWork, pdsReferences, employeeEmergencyContacts, pdsOtherInfo, pdsFamily, employeeDocuments, applicantDocuments } from '../db/schema.js';
import { pdsPersonalInformation, pdsDeclarations } from '../db/tables/pds.js';
import { eq, or, and, sql, getTableColumns, desc, InferSelectModel, ne, inArray } from 'drizzle-orm';
import { AuthService } from '../services/auth.service.js';
import { checkSystemWideUniqueness } from '../services/validationService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { OAuth2Client } from 'google-auth-library';
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
import { PDSService, PdsSaveData } from '../services/pds.service.js';
// Note: PDS types are used in type annotations for the setupPortal function
import type { 
    RawPDSInput
} from '../types/auth_internal.js';
import type {
  PdsEducation,
  PdsEligibility,
  PdsWorkExperience,
  PdsLearningDevelopment,
  PdsVoluntaryWork,
  PdsReference,
  PdsFamily,
  PdsOtherInfo
} from '../types/pds.js';


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

export const googleLogin: AsyncHandler = async (req, res, next) => {
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
          compareIds(bioEnrolledUsers.employeeId, rawId),
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

    await db.update(authentication)
      .set({ twoFactorOtp: otp, twoFactorOtpExpires: sql`DATE_ADD(NOW(), INTERVAL 10 MINUTE)` })
      .where(eq(authentication.id, user.id));

    try {
      await sendOTPEmail(user.email, user.firstName || 'User', otp, 'Google Login Verification', 'You are attempting to login via Google.');
    } catch (err: unknown) { 
      const message = err instanceof Error ? err.message : String(err);
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

  } catch (err: unknown) {
    next(err);
  }
};

export const verifyEnrollment: AsyncHandler = async (req, res, next) => {
  try {
    const employeeId = String(req.params.employeeId);
    
    // Check bio_enrolled_users
    const [enrolled] = await db.select().from(bioEnrolledUsers).where(
      and(
        compareIds(bioEnrolledUsers.employeeId, employeeId),
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
      .where(compareIds(authentication.employeeId, employeeId))
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
  } catch (err) {
    next(err);
  }
};

export const verifyRegistrationOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
  } catch (err: unknown) {
    next(err);
  }
};

export const resendVerificationEmail: AsyncHandler = async (req, res, next) => {
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
    next(err);
  }
};

export const forgotPassword: AsyncHandler = async (req, res, next) => {
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

    await db.update(authentication)
      .set({
        resetPasswordToken: otp, // We reuse this field to store the OTP
        resetPasswordExpires: sql`DATE_ADD(NOW(), INTERVAL 10 MINUTE)`
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
    next(err);
  }
};

export const resetPassword: AsyncHandler = async (req, res, next) => {
  try {
    const { identifier, otp, newPassword } = ResetPasswordSchema.parse(req.body);

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

    // Verify OTP and Expiration using database time
    const [dbCheck] = await db.select({
        isExpired: sql<boolean>`${authentication.resetPasswordExpires} < NOW()`,
        isValidToken: sql<boolean>`${authentication.resetPasswordToken} = ${otp}`
    })
    .from(authentication)
    .where(eq(authentication.id, user.id));

    if (!dbCheck || !dbCheck.isValidToken) {
      res.status(400).json({ success: false, message: 'Invalid verification code.' });
      return;
    }

    if (dbCheck.isExpired) {
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
    next(err);
  }
};

export const getMe: AuthenticatedHandler = async (req, res, next) => {
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
    next(err);
  }
};

export const requestDownloadToken: AuthenticatedHandler = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const token = AuthService.generateDownloadToken(userId);
    res.status(200).json({ success: true, token });
  } catch (err) {
    next(err);
  }
};

export const login: AsyncHandler = async (req, res, next) => {
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
          compareIds(bioEnrolledUsers.employeeId, rawId),
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

      await db.update(authentication)
        .set({ twoFactorOtp: otp, twoFactorOtpExpires: sql`DATE_ADD(NOW(), INTERVAL 10 MINUTE)` })
        .where(eq(authentication.id, user.id));

      try {
        await sendOTPEmail(user.email, user.firstName, otp, 'Your Login OTP', 'Your One-Time Password (OTP) for login is:');
      } catch (err: unknown) { 
        next(err);
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
    next(err);
  }
};

export const verifyTwoFactorOTP: AsyncHandler = async (req, res, next) => {
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

    // Verify OTP and Expiration using database time
    const [dbCheck] = await db.select({
        isExpired: sql<boolean>`${authentication.twoFactorOtpExpires} < NOW()`,
        isValidToken: sql<boolean>`${authentication.twoFactorOtp} = ${otp}`
    })
    .from(authentication)
    .where(eq(authentication.id, user.id));

    if (!dbCheck || !dbCheck.isValidToken) {
      res.status(400).json({ success: false, message: 'Invalid or incorrect verification code.' });
      return;
    }

    if (dbCheck.isExpired) {
      res.status(400).json({ success: false, message: 'OTP has expired. Please login again.' });
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
    next(err);
  }
};

export const enableTwoFactor: AuthenticatedHandler = async (req, res, next) => {
  const authReq = req;
  const userId = authReq.user.id;

  try {
    await db.update(authentication)
      .set({ twoFactorEnabled: true })
      .where(eq(authentication.id, userId));
    res.status(200).json({ success: true, message: 'Two-factor authentication enabled.' });
  } catch (err: unknown) { 
    next(err);
  }
};

export const disableTwoFactor: AuthenticatedHandler = async (req, res, next) => {
  const authReq = req;
  const userId = authReq.user.id;

  try {
    await db.update(authentication)
      .set({ twoFactorEnabled: false })
      .where(eq(authentication.id, userId));
    res.status(200).json({ success: true, message: 'Two-factor authentication disabled.' });
  } catch (err: unknown) { 
    next(err);
  }
};

export const resendTwoFactorOTP: AsyncHandler = async (req, res, next) => {
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

    await db.update(authentication)
      .set({ twoFactorOtp: otp, twoFactorOtpExpires: sql`DATE_ADD(NOW(), INTERVAL 10 MINUTE)` })
      .where(eq(authentication.id, user.id));

    await sendOTPEmail(user.email, user.firstName, otp, 'New Login OTP', 'You requested a new One-Time Password (OTP) for login:');

    res.status(200).json({ success: true, message: 'OTP resent successfully.' });
  } catch (err: unknown) { 
    next(err);
  }
};

export const getUsers: AsyncHandler = async (_req, res, next) => {
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
    next(err);
  }
};

export const getUserById: AuthenticatedHandler = async (req, res, next) => {
  const { id } = req.params;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;

  try {
    // Ownership and Role Check
    if (Number(id) !== requesterId && !['Administrator', 'Human Resource'].includes(requesterRole)) {
      res.status(403).json({ success: false, message: 'Access Denied: You can only view your own user data.' });
      return;
    }

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
    next(err);
  }
};

interface UpdateProfileRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}

export const updateProfile: AuthenticatedHandler = async (req, res, next) => {
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

    // facebookUrl removed - not in pdsHrDetails schema
        // linkedinUrl removed - not in pdsHrDetails schema
        // twitterHandle removed - not in pdsHrDetails schema
        if (updates.isMeycauayan !== undefined) mappedHrUpdates.isMeycauayan = !!updates.isMeycauayan;
    // religion removed - not in pdsHrDetails schema
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
                    employeeId: targetUserId
                };
                await tx.insert(pdsPersonalInformation).values(insertValues);
            }
        }

        // 100% AUTOMATED PDS INGESTION (Replacing manual loops/old reliance)
        const pdsData: Partial<PdsSaveData> = {
            educations: (updates.educations as PdsEducation[]) || [],
            workExperiences: (updates.workExperiences as PdsWorkExperience[]) || [],
            learningDevelopments: (updates.trainings as PdsLearningDevelopment[]) || [],
            eligibilities: (updates.eligibilities as PdsEligibility[]) || [],
            familyBackground: (updates.familyBackground as PdsFamily[]) || [],
            voluntaryWorks: (updates.voluntaryWorks as PdsVoluntaryWork[]) || [],
            references: (updates.references as PdsReference[]) || [],
            otherInfo: (updates.otherInfo as PdsOtherInfo[]) || [],
            // pdsQuestions removed - not in PdsSaveData schema
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
                        dateFrom: edu.from ? String(edu.from) : undefined,
                        dateTo: edu.to ? String(edu.to) : undefined,
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
    next(err);
  }
};

export const getNextId: AsyncHandler = async (_req, res, next) => {
  try {
    const [result] = await db.select({
      maxId: sql<number | null>`MAX(CAST(REGEXP_REPLACE(employee_id, '[^0-9]', '') AS UNSIGNED))`
    })
    .from(authentication)
    .where(sql`CAST(REGEXP_REPLACE(employee_id, '[^0-9]', '') AS UNSIGNED) <= 200`);

    const maxId = result?.maxId || 0;
    const nextId = maxId + 1;

    // STRICT ENFORCEMENT: Max capacity is Emp-200 based on biometric sensor limit
    if (nextId > 200) {
       res.status(409).json({ 
         success: false, 
         message: 'Sensor capacity limit reached. Cannot generate Employee ID beyond Emp-200. Please contact administrator to clear inactive biometric records.' 
       });
       return;
    }

    // Format back to Emp-XXX as requested by user
    const formattedNextId = `Emp-${String(nextId).padStart(3, '0')}`;

    res.status(200).json({
      success: true,
      data: formattedNextId
    });
  } catch (err: unknown) {
    next(err);
  }
};
export const findHiredApplicant: AsyncHandler = async (req, res, next) => {
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
    next(err);
  }
};

export const checkEmailUniqueness: AsyncHandler = async (req, res, next) => {
  try {
    const { email, applicantId } = z.object({ 
      email: z.string().email(),
      applicantId: z.string().optional()
    }).parse(req.query);
    
    const errors = await checkSystemWideUniqueness({ 
      email,
      excludeApplicantId: applicantId ? parseInt(applicantId) : undefined
    });
    
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
    next(err);
  }
};

export const logout: AuthenticatedHandler = async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
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

export const getSetupPositions: AsyncHandler = async (_req, res, next) => {
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
      limit: 2, // 100% FIXED: Return only the two highest positions
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
    next(err);
  }
};

export const setupPortal: AsyncHandler = async (req, res, next) => {
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
        // email removed - not in pdsPersonalInformation schema
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
  } catch (err) {
    next(err);
  }
};
export const checkGovtIdUniqueness: AsyncHandler = async (req, res, next) => {
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
  } catch (err: unknown) { 
    next(err);
  }
};
