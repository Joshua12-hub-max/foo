import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { recruitmentJobs, recruitmentApplicants, authentication, recruitmentSecurityLogs, pdsHrDetails, applicantEducation, applicantExperience, applicantTraining, applicantEligibility, applicantDocuments } from '../db/schema.js';
import { eq, and, sql, desc, or, inArray, isNull, SQL, InferSelectModel, isNotNull, ne } from 'drizzle-orm';
/* eslint-disable-next-line @typescript-eslint/naming-convention */
import PDFDocument from 'pdfkit';
import path from 'path';
import * as fs from 'fs';
import { getTemplateForStage, replaceVariables, sendEmailNotification, prepareEmailVariables } from '../utils/emailHelpers.js';
import { checkSystemWideUniqueness } from '../services/validationService.js';
import { generateGoogleMeetLink } from '../services/meetingService.js';
import { generateInterviewICS } from '../services/calendar.service.js';
import { currentManilaDateTime } from '../utils/dateUtils.js';
import { sanitizeInput, isDisposableEmail } from '../utils/spamUtils.js';
import type { JobStatus, ApplicantStage, ApplicantStatus, AuthenticatedRequest } from '../types/index.js';
import { AuditService } from '../services/audit.service.js';

export type Applicant = InferSelectModel<typeof recruitmentApplicants>;
export type Job = InferSelectModel<typeof recruitmentJobs>;
export type Education = InferSelectModel<typeof applicantEducation>;
export type Experience = InferSelectModel<typeof applicantExperience>;
export type Training = InferSelectModel<typeof applicantTraining>;
export type Eligibility = InferSelectModel<typeof applicantEligibility>;
export type Interviewer = Pick<InferSelectModel<typeof authentication>, 'firstName' | 'lastName' | 'middleName' | 'suffix'>;

export interface ApplicantWithRelations extends Applicant {
    recruitmentJob?: Job | null;
    educations?: Education[];
    experiences?: Experience[];
    trainings?: Training[];
    eligibilities?: Eligibility[];
    authentication?: Interviewer | null;
}

import {
  createJobSchema,
  updateJobSchema,
  updateApplicantStageSchema,
  generateMeetingLinkSchema,
  saveInterviewNotesSchema,
  generateOfferLetterSchema,
  assignInterviewerSchema,
  confirmHiredSchema,
  verifyOTPSchema,
  createStrictApplyJobSchema,
  ApplyJobData
} from '../schemas/recruitmentSchema.js';

// ApplicantWithRelations already defined above using Drizzle types

import { 
  verifyFileHeader, 
  verifyEmailDomain, 
  logSecurityViolation 
} from '../utils/recruitmentUtils.js';
import { checkDuplicateApplication, sendApplicationNotifications } from '../services/recruitmentService.js';
import { notifyAdmins } from './notificationController.js';
import type { AuthenticatedHandler } from '../types/index.js';

/**
 * Manual EXIF stripper to prevent pdfkit/jpeg-exif BufferOutOfBounds crashes
 * for problematic JPEG images.
 */
function stripExif(buffer: Buffer): Buffer {
  if (buffer.length < 4 || buffer[0] !== 0xFF || buffer[1] !== 0xD8) return buffer;
  
  let offset = 2;
  let result = buffer;
  
  while (offset < result.length - 4) {
    if (result[offset] !== 0xFF) break;
    const marker = result[offset + 1];
    
    // Some markers don't have a length (SOI, EOI, etc.)
    if (marker === 0xD9) break; // End of Image
    if (marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) {
        offset += 2;
        continue;
    }

    const length = result.readUInt16BE(offset + 2);
    
    // 100% PRECISION: Strip ALL APPn segments (Except APP0/JFIF) to avoid parser crashes
    if (marker >= 0xE1 && marker <= 0xEF) { 
      result = Buffer.concat([
        result.subarray(0, offset),
        result.subarray(offset + 2 + length)
      ]);
      // Continue searching from the same offset
      continue;
    }
    
    offset += 2 + length;
  }
  return result;
}

function isApplicantStage(val: string): val is ApplicantStage {
  return ['Applied', 'Screening', 'Initial Interview', 'Final Interview', 'Offer', 'Hired', 'Rejected'].includes(val);
}

export const getHiredByDuty: AuthenticatedHandler = async (req, res) => {
  try {
    const duty = req.query.duty as string | undefined;
    const department = req.query.department as string | undefined;

    // Normalize duty input
    const normalizedDuty = (duty === 'Irregular Duties' || duty === 'Irregular') ? 'Irregular' : duty;

    if (!normalizedDuty || (normalizedDuty !== 'Standard' && normalizedDuty !== 'Irregular')) {
      res.status(400).json({ success: false, message: 'Invalid duty type. Must be Standard or Irregular.' });
      return;
    }

    // Mapping duty categories to the specific db employment_type enums
    const standardTypes = ['Permanent', 'Full-time', 'Temporary', 'Probationary'] as const;
    const irregularTypes = ['Job Order', 'Contractual', 'Casual', 'Coterminous', 'Part-time', 'Contract of Service', 'JO', 'COS'] as const;

    // Explicitly type targetTypes based on recruitmentJobs.employment_type enum
    const targetTypes = (normalizedDuty === 'Standard' ? [...standardTypes] : [...irregularTypes]) as ('Full-time'|'Part-time'|'Contractual'|'Job Order'|'Coterminous'|'Temporary'|'Probationary'|'Casual'|'Permanent'|'Contract of Service'|'JO'|'COS')[];

    const andConditions = [
        eq(recruitmentApplicants.isConfirmed, true),
        eq(recruitmentApplicants.stage, 'Hired'),
        or(
          inArray(recruitmentJobs.employmentType, targetTypes),
          eq(recruitmentJobs.dutyType, normalizedDuty)
        )
    ];

    if (department && typeof department === 'string') {
        andConditions.push(eq(recruitmentJobs.department, department));
    }

    // Fetch hired applicants whose job corresponds to the target employment types OR the duty type category
    // 100% PRECISION: Use Relational Query to fetch nested Education/Experience/etc.
    // Relational Query with 100% combined logic
    const results = await db.query.recruitmentApplicants.findMany({
      where: (applicants, { and, eq, isNull }) => and(
        eq(applicants.isConfirmed, true),
        eq(applicants.stage, 'Hired'),
        isNull(applicants.registeredEmployeeId),
        // RQB where can't join for filtering parent, we perform parent filtering in .map after .findMany
      ),
      with: {
        recruitmentJob: true,
        educations: true,
        experiences: true,
        trainings: true,
        eligibilities: true,
        documents: true,
      },
      orderBy: (applicants, { desc }) => [desc(applicants.hiredDate)]
    });

    // 100% DATA REFINEMENT: Filter and strictly type the results
    const filteredApplicants = (results as ApplicantWithRelations[])
      .filter(applicant => {
        if (!applicant.recruitmentJob) return false;
        const job = applicant.recruitmentJob;
        return (targetTypes as string[]).includes(job.employmentType || '') || job.dutyType === normalizedDuty;
      })
      .filter(applicant => !department || applicant.recruitmentJob?.department === department)
      .map(applicant => {
        const job = applicant.recruitmentJob;
        const photoFile = applicant.photo1x1Path || applicant.photoPath;
        const apiBaseUrl = process.env.API_URL || 'http://localhost:5000';
        return {
          ...applicant,
          photoUrl: photoFile ? `${apiBaseUrl}/uploads/resumes/${photoFile}` : null,
          jobTitle: job?.title || "N/A",
          employmentType: job?.employmentType || "N/A",
          dutyType: job?.dutyType || "N/A",
        };
      });

    res.status(200).json({ success: true, applicants: filteredApplicants });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: 'Failed to fetch hired applicants', error: errorMessage });
  }
};

export const createJob: AuthenticatedHandler = async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const parseResult = createJobSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const { 
        title, department, jobDescription, requirements, location, 
        employmentType, dutyType, applicationEmail, status, 
        requireCivilService, requireGovernmentIds, requireEducationExperience,
        education, experience, training, eligibility, otherQualifications
    } = parseResult.data;

    const jobStatus = status || 'Open';
    const postedAt = jobStatus === 'Open' ? currentManilaDateTime() : null;
    const attachmentPath = req.file ? `/uploads/general/${req.file.filename}` : null;

    await db.insert(recruitmentJobs).values({
      title,
      department,
      jobDescription: jobDescription,
      requirements: requirements || null,
      location,
      employmentType: employmentType,
      dutyType: dutyType,
      applicationEmail: applicationEmail,
      status: jobStatus,
      attachmentPath: attachmentPath,
      requireCivilService: requireCivilService,
      requireGovernmentIds: requireGovernmentIds,
      requireEducationExperience: requireEducationExperience,
      education: education || null,
      experience: experience || null,
      training: training || null,
      eligibility: eligibility || null,
      otherQualifications: otherQualifications || null,
      postedBy: authReq.user.id,
      postedAt: postedAt,
      createdAt: currentManilaDateTime()
    });

    res.status(201).json({ success: true, message: 'Job posted successfully' });

    await AuditService.log({
      userId: authReq.user.id,
      module: 'RECRUITMENT',
      action: 'CREATE',
      details: { title, department, status: jobStatus },
      req
    });

  } catch (error: unknown) {
    console.error('[RecruitmentController] createJob failed:', error);
    res.status(500).json({ success: false, message: 'Failed to create job' });
  }
};

export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, publicView } = req.query;

    const conditions = [];
    if (status && typeof status === 'string') {
      conditions.push(eq(recruitmentJobs.status, status as JobStatus));
    }
    if (publicView === 'true') {
      conditions.push(eq(recruitmentJobs.status, 'Open'));
    }

    const jobs = await db.select()
      .from(recruitmentJobs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(recruitmentJobs.createdAt));

    res.json({ success: true, jobs });
  } catch (error: unknown) {
    console.error('[RecruitmentController] getJobs failed:', error);
    const err = error instanceof Error ? error.message : 'Unknown database error';

    res.status(500).json({ success: false, message: 'Failed to fetch jobs', error: err });
  }
};

export const getJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const job = await db.query.recruitmentJobs.findFirst({
      where: eq(recruitmentJobs.id, Number(id))
    });

    if (!job) {
      res.status(404).json({ success: false, message: 'Job not found' });
      return;
    }
    res.json({ success: true, job });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: 'Failed to fetch job' });
  }
};

interface DbApplicantRow {
    id: number;
    jobId: number | null;
    firstName: string;
    lastName: string;
    email: string;
    tinNumber: string | null;
    gsisNumber: string | null;
    philsysId: string | null;
    philhealthNumber: string | null;
    pagibigNumber: string | null;
    umidNumber: string | null;
}

export const applyJob = async (req: Request, res: Response): Promise<void> => {
  try {
    // DEBUG: Log incoming request structure
    console.log('[RECRUITMENT] Application received');
    console.log('[RECRUITMENT] Body keys:', Object.keys(req.body));
    const files = (req as { files?: Record<string, Express.Multer.File[]> }).files;
    console.log('[RECRUITMENT] Files:', files ? Object.keys(files) : 'None');
    console.log('[RECRUITMENT] JobId:', req.body.jobId);
    console.log('[RECRUITMENT] DutyType:', req.body.dutyType);

    // 0. Pre-parse JSON strings from multipart/form-data (PDS Aligned)
    const body = req.body as Record<string, string | number | boolean | object | null | undefined>;
    const jsonFields = [
      'education', 'eligibilities', 'workExperiences', 'trainings',
      'familyBackground', 'children', 'voluntaryWorks', 'references', 'otherInfo', 'declarations'
    ];
    jsonFields.forEach(field => {
      const value = body[field];
      if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
        try {
          body[field] = JSON.parse(value) as Record<string, unknown>;
        } catch (_e) {
          // Keep as string if parsing fails — Zod will reject invalid shapes
        }
      }
    });

    const reqJobId = body.jobId;

    if (!reqJobId) {
        res.status(400).json({ success: false, message: 'jobId is required' });
        return;
    }

    const jobConfig = await db.query.recruitmentJobs.findFirst({ where: eq(recruitmentJobs.id, Number(reqJobId)) });
    if (!jobConfig) {
        res.status(404).json({ success: false, message: 'Job not found' });
        return;
    }

    const isStandard = jobConfig.dutyType === 'Standard';
    // "Obligado" Logic:
    // If duty is Standard -> Automatically Required.
    // If duty is Irregular -> Only required if the Job Posting explicitly mandated it.
    const requireIds = isStandard || jobConfig.requireGovernmentIds === true;
    const requireCsc = isStandard || jobConfig.requireCivilService === true;
    const requireEdu = isStandard || jobConfig.requireEducationExperience === true;

    const dynamicSchema = createStrictApplyJobSchema(Boolean(requireIds), Boolean(requireCsc), Boolean(requireEdu));
    const parseResult = dynamicSchema.safeParse(req.body);

    if (!parseResult.success) {
       const errors = parseResult.error.flatten().fieldErrors;
       const missingFields = Object.keys(errors);

       console.error('[RECRUITMENT] Validation failed');
       console.error('[RECRUITMENT] Missing/invalid fields:', missingFields);
       console.error('[RECRUITMENT] Detailed errors:', JSON.stringify(errors, null, 2));

       res.status(400).json({
         success: false,
         message: 'Please complete all required fields for this position.',
         errors,
         missingFields,
         hint: missingFields.length > 5
           ? 'This position requires a complete PDS. Please fill all sections.'
           : `Please check: ${missingFields.join(', ')}`
       });
       return;
    }

    const {
      jobId, firstName, lastName, middleName, suffix, email, phoneNumber,
      isMeycauayanResident,
      birthDate, birthPlace, sex, civilStatus, height,
      weight, bloodType, gsisNumber, pagibigNumber, philhealthNumber, umidNumber, philsysId, tinNumber,
      education, totalExperienceYears,
      skills, emergencyContact, emergencyContactNumber,
      resRegion, resProvince, resCity, resBarangay, resHouseBlockLot, resSubdivision, resStreet, zipCode,
      permRegion, permProvince, permCity, permBarangay, permHouseBlockLot, permSubdivision, permStreet, permanentZipCode,
      trainings,
      eligibilities,
      workExperiences,
      hpField, websiteUrl, hToken,
      nationality, telephoneNumber, agencyEmployeeNo, facebookUrl, linkedinUrl, twitterHandle,
      citizenshipType, dualCountry, govtIdType, govtIdNo, govtIdIssuance,
      familyBackground, children, voluntaryWorks, references, otherInfo, declarations
    } = parseResult.data;

    // Construct full address strings for persistence and searchability
    const fullAddress = [resHouseBlockLot, resSubdivision, resStreet, resBarangay, resCity, resProvince, resRegion]
        .filter(Boolean).join(', ');
    const fullPermanentAddress = [permHouseBlockLot, permSubdivision, permStreet, permBarangay, permCity, permProvince, permRegion]
        .filter(Boolean).join(', ');

    // File Integrity Audit
    const resume = files?.['resume']?.[0];
    const eligibilityCert = files?.['eligibilityCert']?.[0];
    const photo = files?.['photo']?.[0];

    if (resume && !(await verifyFileHeader(resume.path))) {
        res.status(400).json({ success: false, message: 'Invalid resume file integrity. Please upload a real PDF or Word document.' });
        return;
    }
    if (eligibilityCert && !(await verifyFileHeader(eligibilityCert.path))) {
        res.status(400).json({ success: false, message: 'Invalid eligibility certificate file integrity.' });
        return;
    }
    if (photo && !(await verifyFileHeader(photo.path))) {
        res.status(400).json({ success: false, message: 'Invalid photo file integrity. Please upload a real image.' });
        return;
    }

    // Verify uploaded files exist
    if (resume) {
        if (!fs.existsSync(resume.path)) {
            console.error('[RECRUITMENT] Resume file missing after upload:', resume.path);
            res.status(500).json({ success: false, message: 'Resume upload failed. Please try again.' });
            return;
        }
        console.log('[RECRUITMENT] Resume uploaded successfully:', resume.path);
    }

    if (eligibilityCert) {
        if (!fs.existsSync(eligibilityCert.path)) {
            console.error('[RECRUITMENT] Eligibility cert missing after upload:', eligibilityCert.path);
            res.status(500).json({ success: false, message: 'Certificate upload failed. Please try again.' });
            return;
        }
        console.log('[RECRUITMENT] Eligibility certificate uploaded:', eligibilityCert.path);
    }

    if (photo) {
        if (!fs.existsSync(photo.path)) {
            console.error('[RECRUITMENT] Photo missing after upload:', photo.path);
            res.status(500).json({ success: false, message: 'Photo upload failed. Please try again.' });
            return;
        }
        console.log('[RECRUITMENT] Photo uploaded successfully:', photo.path);
    }

    // CSC Compliance Check
    const isCSCRequired = ['Permanent', 'Temporary', 'Probationary'].includes(jobConfig.employmentType || '');
    if (isCSCRequired) {
        if (!eligibilities || eligibilities.length === 0) {
            res.status(400).json({ success: false, message: 'CSC/Permanent positions require at least one Eligibility detail.' });
            return;
        }
        if (!eligibilityCert) {
            res.status(400).json({ success: false, message: 'CSC/Permanent positions require a Certificate of Eligibility upload.' });
            return;
        }
    }

    // Spam Guard: Honeypot & Human Token
    // 4. Anti-Spam: Validation Honeypot + hToken Verification
    if ((hpField && hpField.length > 0) || (websiteUrl && websiteUrl.length > 0)) {
        console.warn(`[RECRUITMENT] Bot attempt blocked: Honeypot fields populated (HP: ${hpField}, URL: ${websiteUrl})`);
        res.status(201).json({ success: true, message: 'Application submitted successfully' });
        return;
    }

    if (!hToken || !hToken.startsWith('v-')) {
        console.warn(`[RECRUITMENT] Submission rejected: Missing or invalid hToken`);
        res.status(400).json({ success: false, message: 'Invalid submission signature. Please refresh and try again.' });
        return;
    }

    // 5. Identity Fraud & Per-Job Duplicate Check (RAW SQL for 100% Reliability)
    try {
        console.log('[RECRUITMENT] Starting raw-SQL duplicate check for:', email);
        
        // 100% PRECISION: Use native select to avoid casting issues
        const existingApplications = await db.select({
            id: recruitmentApplicants.id,
            jobId: recruitmentApplicants.jobId,
            firstName: recruitmentApplicants.firstName,
            lastName: recruitmentApplicants.lastName,
            email: recruitmentApplicants.email,
            tinNumber: recruitmentApplicants.tinNumber,
            gsisNumber: recruitmentApplicants.gsisNumber,
            philsysId: recruitmentApplicants.philsysId,
            philhealthNumber: recruitmentApplicants.philhealthNumber,
            pagibigNumber: recruitmentApplicants.pagibigNumber,
            umidNumber: recruitmentApplicants.umidNumber
        }).from(recruitmentApplicants).where(
            or(
                eq(recruitmentApplicants.email, email),
                and(isNotNull(recruitmentApplicants.tinNumber), ne(recruitmentApplicants.tinNumber, ''), eq(recruitmentApplicants.tinNumber, tinNumber ?? 'NEVER_MATCH')),
                and(isNotNull(recruitmentApplicants.gsisNumber), ne(recruitmentApplicants.gsisNumber, ''), eq(recruitmentApplicants.gsisNumber, gsisNumber ?? 'NEVER_MATCH')),
                and(isNotNull(recruitmentApplicants.philsysId), ne(recruitmentApplicants.philsysId, ''), eq(recruitmentApplicants.philsysId, philsysId ?? 'NEVER_MATCH')),
                and(isNotNull(recruitmentApplicants.philhealthNumber), ne(recruitmentApplicants.philhealthNumber, ''), eq(recruitmentApplicants.philhealthNumber, philhealthNumber ?? 'NEVER_MATCH')),
                and(isNotNull(recruitmentApplicants.pagibigNumber), ne(recruitmentApplicants.pagibigNumber, ''), eq(recruitmentApplicants.pagibigNumber, pagibigNumber ?? 'NEVER_MATCH')),
                and(isNotNull(recruitmentApplicants.umidNumber), ne(recruitmentApplicants.umidNumber, ''), eq(recruitmentApplicants.umidNumber, umidNumber ?? 'NEVER_MATCH'))
            )
        ).limit(10);

        if (existingApplications && Array.isArray(existingApplications) && existingApplications.length > 0) {
            console.log(`[RECRUITMENT] Analyzing ${existingApplications.length} potential duplicates via Raw SQL`);
            
            for (const existingApplication of existingApplications) {
                const dbFirstName = String(existingApplication.firstName || '');
                const dbLastName = String(existingApplication.lastName || '');
                const dbEmail = String(existingApplication.email || '');
                const dbTin = String(existingApplication.tinNumber || '');
                const dbGsis = String(existingApplication.gsisNumber || '');
                const dbPhilsys = String(existingApplication.philsysId || '');
                const dbPhilhealth = String(existingApplication.philhealthNumber || '');
                const dbPagibig = String(existingApplication.pagibigNumber || '');
                const dbUmid = String(existingApplication.umidNumber || '');
                const dbJobId = existingApplication.jobId;

                // Identity Fraud Detection: Same identifier exists but with a different name
                const isIdMatch = 
                    (dbTin === tinNumber && tinNumber) || 
                    (dbGsis === gsisNumber && gsisNumber) || 
                    (dbPhilsys === philsysId && philsysId) ||
                    (dbPhilhealth === philhealthNumber && philhealthNumber) ||
                    (dbPagibig === pagibigNumber && pagibigNumber) ||
                    (dbUmid === umidNumber && umidNumber) ||
                    (dbEmail === email);
                
                const isNameMismatch = dbFirstName.toLowerCase() !== String(firstName).toLowerCase() || dbLastName.toLowerCase() !== String(lastName).toLowerCase();

                if (isIdMatch && isNameMismatch) {
                    let duplicateField = 'Identifier';
                    if (dbEmail === email) duplicateField = 'Email';
                    else if (dbTin === tinNumber) duplicateField = 'TIN';
                    else if (dbGsis === gsisNumber) duplicateField = 'GSIS';
                    else if (dbPhilsys === philsysId) duplicateField = 'PhilSys ID';
                    else if (dbPhilhealth === philhealthNumber) duplicateField = 'PhilHealth';
                    else if (dbPagibig === pagibigNumber) duplicateField = 'Pag-IBIG';
                    else if (dbUmid === umidNumber) duplicateField = 'UMID';

                    console.warn(`[RECRUITMENT] Identity fraud detected for ${email}. Field: ${duplicateField}. Mismatch: DB(${dbLastName}, ${dbFirstName}) vs Input(${lastName}, ${firstName})`);
                    
                    await logSecurityViolation({
                        jobId: Number(jobId), firstName: firstName, lastName: lastName, email,
                        violationType: 'Identity Fraud', details: `Duplicate ${duplicateField} belongs to another person (${dbLastName}, ${dbFirstName})`,
                        ipAddress: req.ip || 'Unknown'
                    });
                    
                    res.status(409).json({ 
                        success: false, 
                        message: `The provided ${duplicateField} is already registered to another person. Please verify your information.`,
                        field: duplicateField.toLowerCase().replace(' ', '')
                    });
                    return;
                }

                // Per-Job Duplicate Check: Only block if applying for the exact same job
                if (dbJobId !== null && Number(dbJobId) === Number(jobId)) {
                    console.warn(`[RECRUITMENT] Duplicate job application detected for ${email} on Job ${jobId}`);
                    res.status(409).json({ success: false, message: 'You have already applied for this position. Please wait for the screening results.' });
                    return;
                }
            }
        }

    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[RECRUITMENT] FATAL: Raw SQL Duplicate check exception:', errMsg);
        
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error during verification',
            error: errMsg
        });
        return;
    }

    // Email Domain Audit
    if (isDisposableEmail(email)) {
        await logSecurityViolation({
            jobId: Number(jobId), firstName, lastName, email,
            violationType: 'Disposable Email', details: `Blocked temporary mail provider`,
            ipAddress: req.ip || 'Unknown'
        });
        res.status(400).json({ success: false, message: 'Disposable email addresses are not allowed.' });
        return;
    }

    if (!(await verifyEmailDomain(email))) {
        await logSecurityViolation({
            jobId: Number(jobId), firstName, lastName, email,
            violationType: 'Invalid Email Domain', details: `No MX records found`,
            ipAddress: req.ip || 'Unknown'
        });
        res.status(400).json({ success: false, message: 'Invalid email domain. Please use a verified provider.' });
        return;
    }

    // Process Application 100% PRECISION: Use Transaction for Relational Consistency
    const insertHeader = await db.transaction(async (tx) => {
        const [header] = await tx.insert(recruitmentApplicants).values({
            jobId: Number(jobId),
            firstName: sanitizeInput(firstName),
            lastName: sanitizeInput(lastName),
            middleName: middleName ? sanitizeInput(middleName) : null,
            suffix: suffix ? sanitizeInput(suffix) : null,
            email,
            phoneNumber: phoneNumber,
            address: sanitizeInput(fullAddress),
            zipCode: zipCode,
            permanentAddress: fullPermanentAddress ? sanitizeInput(fullPermanentAddress) : null,
            permanentZipCode: permanentZipCode,
            isMeycauayanResident: isMeycauayanResident ? true : false,
            birthDate: birthDate,
            birthPlace: sanitizeInput(birthPlace),
            sex: sex,
            civilStatus: civilStatus,
            height,
            weight,
            bloodType: bloodType,
            gsisNumber: gsisNumber,
            pagibigNumber: pagibigNumber,
            philhealthNumber: philhealthNumber,
            umidNumber: umidNumber,
            philsysId: philsysId,
            tinNumber: tinNumber,
            
            // Legacy JSON Persistence (Maintained temporarily for PDF/Existing reports)
            eligibility: eligibilities ? JSON.stringify(eligibilities) : null,
            eligibilityType: eligibilities?.[0]?.name || null,
            eligibilityDate: eligibilities?.[0]?.examDate || null,
            eligibilityRating: eligibilities?.[0]?.rating || null,
            eligibilityPlace: eligibilities?.[0]?.examPlace || null,
            licenseNo: eligibilities?.[0]?.licenseNo || null,
            eligibilityPath: eligibilityCert?.filename || null,
            
            totalExperienceYears: totalExperienceYears,
            educationalBackground: education ? JSON.stringify(education) : null,
            experience: workExperiences ? JSON.stringify(workExperiences) : null,
            training: trainings ? JSON.stringify(trainings) : null,
            
            // Header info from highest education level
            schoolName: education?.College?.school ?? education?.Secondary?.school ?? null,
            yearGraduated: education?.College?.yearGrad ?? education?.Secondary?.yearGrad ?? null,
            course: education?.College?.course ?? null,
            
            skills: skills ? sanitizeInput(skills) : null,
            emergencyContact: emergencyContact ? sanitizeInput(emergencyContact) : null,
            emergencyContactNumber: emergencyContactNumber || null,
            resumePath: resume?.filename || null,
            photoPath: photo?.filename || null,
            photo1x1Path: photo?.filename || null,
            resRegion: resRegion || null,
            resProvince: resProvince || null,
            resCity: resCity || null,
            resBarangay: resBarangay || null,
            resHouseBlockLot: resHouseBlockLot || null,
            resSubdivision: resSubdivision || null,
            resStreet: resStreet || null,
            permRegion: permRegion || null,
            permProvince: permProvince || null,
            permCity: permCity || null,
            permBarangay: permBarangay || null,
            permHouseBlockLot: permHouseBlockLot || null,
            permSubdivision: permSubdivision || null,
            permStreet: permStreet || null,
            nationality: nationality || 'Filipino',
            telephoneNumber: telephoneNumber || null,
            agencyEmployeeNo: agencyEmployeeNo || null,
            facebookUrl: facebookUrl || null,
            linkedinUrl: linkedinUrl || null,
            twitterHandle: twitterHandle || null,
            citizenshipType: citizenshipType || null,
            dualCountry: dualCountry || null,
            govtIdType: govtIdType || null,
            govtIdNo: govtIdNo || null,
            govtIdIssuance: govtIdIssuance || null,
            
            // 100% DATA FLOW: Expanded PDS fields for automated registration
            familyBackground: familyBackground ? JSON.stringify(familyBackground) : null,
            children: children ? JSON.stringify(children) : null,
            voluntaryWork: voluntaryWorks ? JSON.stringify(voluntaryWorks) : null,
            pdsReferences: references ? JSON.stringify(references) : null,
            otherInfo: otherInfo ? JSON.stringify(otherInfo) : null,
            pdsQuestions: declarations ? JSON.stringify(declarations) : null,

            verificationToken: null,
            isEmailVerified: true,
            createdAt: currentManilaDateTime()
        });

        const applicantId = header.insertId;

        // 100% DATA PROPAGATION: Insert into Relational Tables
        if (education) {
            const eduEntriesRaw = Object.entries(education)
                .filter(([_, data]) => {
                    return data && (data.school || data.course);
                });
            
            for (const [level, data] of eduEntriesRaw) {
                // Type safety ensured by Object.entries on Zod-validated data
                type ZodEduData = NonNullable<ApplyJobData['education']>[keyof NonNullable<ApplyJobData['education']>];
                const eduData = data as ZodEduData;
                const mappedLevel = (level === 'Graduate') ? 'Graduate Studies' : level as Education['level'];

                await tx.insert(applicantEducation).values({
                    applicantId: Number(applicantId),
                    level: mappedLevel,
                    schoolName: eduData?.school || "N/A",
                    degreeCourse: eduData?.course || null,
                    yearGraduated: String(eduData?.yearGrad || ""),
                    unitsEarned: String(eduData?.units || ""),
                    dateFrom: String(eduData?.from || ""),
                    dateTo: String(eduData?.to || ""),
                    honors: eduData?.honors || null
                });
            }
        }

        if (workExperiences && workExperiences.length > 0) {
            for (const exp of workExperiences) {
                await tx.insert(applicantExperience).values({
                    applicantId: Number(applicantId),
                    dateFrom: String(exp.dateFrom || ""),
                    dateTo: String(exp.dateTo || ""),
                    positionTitle: exp.positionTitle || "N/A",
                    companyName: exp.companyName || "N/A",
                    monthlySalary: exp.monthlySalary ? String(exp.monthlySalary) : null,
                    salaryGrade: exp.salaryGrade || null,
                    appointmentStatus: exp.appointmentStatus || null,
                    isGovernment: exp.isGovernment === true
                });
            }
        }

        if (trainings && trainings.length > 0) {
            for (const t of trainings) {
                await tx.insert(applicantTraining).values({
                    applicantId: Number(applicantId),
                    title: t.title || "N/A",
                    dateFrom: String(t.dateFrom || ""),
                    dateTo: String(t.dateTo || ""),
                    hoursNumber: t.hoursNumber ? Number(t.hoursNumber) : null,
                    typeOfLd: t.typeOfLd || null,
                    conductedBy: t.conductedBy || null
                });
            }
        }

        if (eligibilities && eligibilities.length > 0) {
            for (const e of eligibilities) {
                await tx.insert(applicantEligibility).values({
                    applicantId: Number(applicantId),
                    eligibilityName: e.name || "N/A",
                    rating: e.rating ? String(e.rating) : null,
                    examDate: String(e.examDate || ""),
                    examPlace: e.examPlace || null,
                    licenseNumber: e.licenseNo || null,
                    validityDate: String(e.licenseValidUntil || "")
                });
            }
        }

        // Insert document metadata into applicant_documents table
        const documentsToInsert = [];

        if (resume) {
            documentsToInsert.push({
                applicantId: Number(applicantId),
                documentName: resume.originalname,
                documentType: 'Resume',
                filePath: resume.filename,
                fileSize: resume.size,
                mimeType: resume.mimetype,
            });
        }

        if (photo) {
            documentsToInsert.push({
                applicantId: Number(applicantId),
                documentName: photo.originalname,
                documentType: 'Photo',
                filePath: photo.filename,
                fileSize: photo.size,
                mimeType: photo.mimetype,
            });

            // Photo1x1 is same file (legacy duplicate)
            documentsToInsert.push({
                applicantId: Number(applicantId),
                documentName: photo.originalname,
                documentType: 'Photo1x1',
                filePath: photo.filename,
                fileSize: photo.size,
                mimeType: photo.mimetype,
            });
        }

        if (eligibilityCert) {
            documentsToInsert.push({
                applicantId: Number(applicantId),
                documentName: eligibilityCert.originalname,
                documentType: 'EligibilityCert',
                filePath: eligibilityCert.filename,
                fileSize: eligibilityCert.size,
                mimeType: eligibilityCert.mimetype,
            });
        }

        // Batch insert all documents
        if (documentsToInsert.length > 0) {
            await tx.insert(applicantDocuments).values(documentsToInsert);
        }

        return header;
    });

    // Drizzle for MySQL returns [ResultSetHeader, fields]
    // The insertId is the ID of the new record
    const applicantId = insertHeader.insertId;
    
    if (!applicantId) {
        throw new Error("Failed to retrieve applicant ID after insertion.");
    }

    // --- AUTO-GENERATE AND SAVE PHYSICAL PDF COPY ---
    try {
        const appPath = path.join(process.cwd(), 'uploads/applications');
        if (!fs.existsSync(appPath)) fs.mkdirSync(appPath, { recursive: true });

        const fileName = `application_${lastName}_${applicantId}.pdf`;
        const filePath = path.join(appPath, fileName);
        
        const saveDoc = new PDFDocument({ margin: 40, size: 'LEGAL', bufferPages: true });
        const writeStream = fs.createWriteStream(filePath);
        saveDoc.pipe(writeStream);

        // Reuse the enhanced PDF design logic (Simplified version for background saving)
        const colors = { primary: '#1e293b', secondary: '#334155', accent: '#0284c7', text: '#1a1a1a', muted: '#64748b', border: '#e2e8f0', background: '#f8fafc', white: '#ffffff' };
        
        const drawBorder = (d: PDFKit.PDFDocument) => { d.rect(20, 20, d.page.width - 40, d.page.height - 40).lineWidth(0.5).strokeColor(colors.border).stroke(); };
        const sHeader = (d: PDFKit.PDFDocument, t: string) => { 
            if (d.y + 60 > d.page.height - 60) { d.addPage(); drawBorder(d); }
            d.moveDown(0.8); const y = d.y; d.rect(40, y, d.page.width - 80, 20).fill(colors.primary); 
            d.fillColor(colors.white).fontSize(10).font('Helvetica-Bold').text(t.toUpperCase(), 50, y + 6); d.moveDown(0.5); 
        };
        const fld = (d: PDFKit.PDFDocument, l: string, v: string | number | null | undefined, x: number, y: number, w: number) => {
            d.fontSize(7).font('Helvetica-Bold').fillColor(colors.muted).text(l.toUpperCase(), x, y);
            d.fontSize(10).font('Helvetica').fillColor(colors.text).text(v != null ? String(v) : '---', x, y + 10, { width: w - 10, lineBreak: false });
            d.moveTo(x, y + 24).lineTo(x + w - 10, y + 24).lineWidth(0.1).strokeColor(colors.border).stroke();
        };

        drawBorder(saveDoc);
        const lPath = path.join(process.cwd(), '../frontend/src/assets/meycauayan-logo.png');
        if (fs.existsSync(lPath)) saveDoc.image(lPath, 50, 45, { width: 50 });
        saveDoc.fillColor(colors.secondary).fontSize(8).font('Helvetica').text('Republic of the Philippines', { align: 'center' });
        saveDoc.fontSize(12).font('Helvetica-Bold').text('CITY GOVERNMENT OF MEYCAUAYAN', { align: 'center' });
        saveDoc.fontSize(10).font('Helvetica-Bold').fillColor(colors.accent).text('CITY HUMAN RESOURCE MANAGEMENT OFFICE', { align: 'center' });
        saveDoc.moveTo(40, 110).lineTo(saveDoc.page.width - 40, 110).lineWidth(1.5).strokeColor(colors.primary).stroke();
        
        saveDoc.y = 125;
        saveDoc.rect(40, saveDoc.y, 300, 25).fill(colors.background);
        saveDoc.fillColor(colors.primary).fontSize(12).font('Helvetica-Bold').text('JOB APPLICATION FORM', 50, saveDoc.y + 7);
        saveDoc.fillColor(colors.muted).fontSize(8).font('Helvetica').text(`Ref ID: APP-${applicantId.toString().padStart(6, '0')}`, 350, 125 - 8, { align: 'right', width: 180 });
        
        saveDoc.moveDown(2);
        const yStart = saveDoc.y;
        fld(saveDoc, 'POSITION APPLIED FOR', jobConfig.title, 40, yStart, 350);
        fld(saveDoc, 'DEPARTMENT', jobConfig.department, 400, yStart, 170);
        
        saveDoc.y = yStart + 40;
        sHeader(saveDoc, '1. Personal Information');
        const r1 = saveDoc.y + 5;
        fld(saveDoc, 'Last Name', lastName, 40, r1, 130);
        fld(saveDoc, 'First Name', firstName, 180, r1, 130);
        fld(saveDoc, 'Middle Name', middleName, 320, r1, 130);
        fld(saveDoc, 'Suffix', suffix, 460, r1, 60);

        saveDoc.end();
    } catch (error) {
        // Continue application even if PDF save fails, but log it
        console.error('[RecruitmentController] Application PDF generation failed:', error);
    }

    // Trigger Notifications
    await sendApplicationNotifications({ jobId: Number(jobId), firstName: firstName, lastName: lastName, email });

    // Internal System Notifications
    try {
      // 1. Notify Admins/HR
      await notifyAdmins({
        senderId: null,
        title: 'New Job Application',
        message: `${lastName}, ${firstName} has applied for ${jobConfig.title}.`,
        type: 'job_application_pending',
        referenceId: applicantId,
        link: `/admin-dashboard/recruitment/applicants?id=${applicantId}`,
        metadata: JSON.stringify({ applicantId, status: 'pending' })
      });

      // 2. Notify Applicant (Internal placeholder if they have an account, though applicants usually don't yet)
      // Since applicants don't have accounts yet, we primarily rely on the email sent by sendApplicationNotifications.
      // But we log it for the system audit.
    } catch (error) {
      console.error('Failed to send internal application notifications:', error);
    }

    console.log('[RECRUITMENT] Application successful');
    console.log('[RECRUITMENT] Applicant ID:', applicantId);
    console.log('[RECRUITMENT] Email sent to:', email);
    console.log('[RECRUITMENT] Files saved:', {
        resumePath: resume?.path || 'None',
        photoPath: photo?.path || 'None',
        eligibilityPath: eligibilityCert?.path || 'None'
    });

    res.status(201).json({
        success: true,
        message: 'Application submitted successfully! HR will review your credentials and contact you via email for the next steps.',
        requiresVerification: false,
        email: email,
        applicantId: applicantId
    });

    await AuditService.log({
      userId: null, // Public applicant
      module: 'RECRUITMENT',
      action: 'APPLY',
      details: { applicantId, jobId, email },
      req
    });

  } catch (error: unknown) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit application', 
      error: error instanceof Error ? error.message : 'Internal Server Error' 
    });
  }
};

export const getApplicantDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { applicantId } = req.params;

    const documents = await db.query.applicantDocuments.findMany({
      where: eq(applicantDocuments.applicantId, Number(applicantId)),
      orderBy: (docs, { desc }) => [desc(docs.uploadedAt)]
    });

    // Add download URLs
    const apiBaseUrl = process.env.API_URL || 'http://localhost:5000';
    const documentsWithUrls = documents.map(doc => ({
      ...doc,
      downloadUrl: `${apiBaseUrl}/uploads/resumes/${doc.filePath}`,
      fileSizeKB: doc.fileSize ? (doc.fileSize / 1024).toFixed(2) : null,
    }));

    res.json({ success: true, documents: documentsWithUrls });
  } catch (error) {
    console.error('Error fetching applicant documents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};


export const getApplicants = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobId = req.query.jobId as string | undefined;
    const stage = req.query.stage as string | undefined;
    const source = req.query.source as string | undefined;

    // 100% PRECISION: Removed Auto-archive logic to ensure manual confirmation as requested.

    const conditions: SQL[] = [];
    
    // 100% PRECISION: Exclude applicants who have already registered as employees.
    // They are no longer part of the recruitment lifecycle.
    conditions.push(isNull(recruitmentApplicants.registeredEmployeeId));

    if (jobId && typeof jobId === 'string' && !isNaN(Number(jobId))) {
      conditions.push(eq(recruitmentApplicants.jobId, Number(jobId)));
    }

    if (stage && typeof stage === 'string') {
      const stageStr = typeof stage === 'string' ? stage : '';
      if (stageStr === 'Pending') {
        const orCondition = or(eq(recruitmentApplicants.stage, 'Applied'), isNull(recruitmentApplicants.stage));
        if (orCondition) conditions.push(orCondition);
        conditions.push(eq(recruitmentApplicants.isConfirmed, false)); // Active list only
      } else if (stageStr === 'Archive') {
        // Archive tab shows Rejected OR Hired+Confirmed
        conditions.push(or(
            eq(recruitmentApplicants.stage, 'Rejected'),
            and(eq(recruitmentApplicants.stage, 'Hired'), eq(recruitmentApplicants.isConfirmed, true))
        ) as SQL);
      } else if (stageStr === 'Reviewed') {
        conditions.push(eq(recruitmentApplicants.stage, 'Screening'));
        conditions.push(eq(recruitmentApplicants.isConfirmed, false)); // Active list only
      } else if (stageStr === 'Interview') {
        conditions.push(inArray(recruitmentApplicants.stage, ['Initial Interview', 'Final Interview']));
        conditions.push(eq(recruitmentApplicants.isConfirmed, false)); // Active list only
      } else if (isApplicantStage(stageStr)) {
        // stageStr is now narrowed to ApplicantStage
        conditions.push(eq(recruitmentApplicants.stage, stageStr));
        if (stageStr !== 'Hired') { // For Hired, we might want to see them before they are confirmed
            conditions.push(eq(recruitmentApplicants.isConfirmed, false));
        }
      }
    }

    if (source && typeof source === 'string' && source !== 'All') {
      const sourceStr = source.toLowerCase();
      if (sourceStr === 'web' || sourceStr === 'email') {
        conditions.push(eq(recruitmentApplicants.source, sourceStr));
      }
    }

    const results = await db.query.recruitmentApplicants.findMany({
      where: (_applicants, { and }) => conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        recruitmentJob: true,
        educations: true,
        experiences: true,
        trainings: true,
        eligibilities: true,
        documents: true,
        authentication: {
          columns: {
            firstName: true,
            lastName: true,
            middleName: true,
            suffix: true
          }
        }
      },
      orderBy: (applicants, { desc }) => [desc(applicants.createdAt)]
    });

    // 100% PRECISION: Maintain flat response structure while including relational arrays
    const applicants = (results as ApplicantWithRelations[]).map(applicant => {
      const interviewer = applicant.authentication;
      const interviewerName = interviewer 
        ? `${interviewer.lastName}, ${interviewer.firstName}${interviewer.middleName ? ' ' + interviewer.middleName.charAt(0) + '.' : ''}${interviewer.suffix ? ' ' + interviewer.suffix : ''}`.trim()
        : null;

      return {
        ...applicant,
        jobTitle: applicant.recruitmentJob?.title || 'General Application',
        jobRequirements: applicant.recruitmentJob?.requirements || '',
        jobDepartment: applicant.recruitmentJob?.department || 'HR',
        jobStatus: applicant.recruitmentJob?.status || 'Open',
        jobEmploymentType: applicant.recruitmentJob?.employmentType || 'Full-time',
        jobDutyType: applicant.recruitmentJob?.dutyType || 'Standard',
        interviewerName
      };
    });

    res.json({ success: true, applicants });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    res.status(500).json({ success: false, message: 'Failed to fetch applicants', error: message });
  }
};

export const updateApplicantStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const parseResult = updateApplicantStageSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const { stage, interviewDate, interviewLink, notes, interviewPlatform } = parseResult.data;

    // Map stage to status column using a strict map
    const statusMap: Record<ApplicantStage, ApplicantStatus> = {
      'Applied': 'Applied',
      'Screening': 'Screening',
      'Initial Interview': 'Interview',
      'Final Interview': 'Interview',
      'Offer': 'Offer',
      'Hired': 'Hired',
      'Rejected': 'Rejected'
    };

    const applicantStatus = statusMap[stage];

    const updateValues: Partial<typeof recruitmentApplicants.$inferInsert> = {
      stage,
      status: applicantStatus
    };
    if (interviewDate) updateValues.interviewDate = interviewDate;
    if (interviewLink !== undefined) updateValues.interviewLink = interviewLink;
    if (interviewPlatform) updateValues.interviewPlatform = interviewPlatform;
    if (notes !== undefined) updateValues.interviewNotes = notes;
    if (stage === 'Hired') updateValues.hiredDate = currentManilaDateTime();

    await db.update(recruitmentApplicants)
      .set(updateValues)
      .where(eq(recruitmentApplicants.id, Number(id)));

    type ApplicantWithJob = typeof recruitmentApplicants.$inferSelect & {
        recruitmentJob: { title: string } | null;
    };

    const applicant = await db.query.recruitmentApplicants.findFirst({
      where: eq(recruitmentApplicants.id, Number(id)),
      with: {
        recruitmentJob: { columns: { title: true } }
      }
    }) as ApplicantWithJob | undefined;

    if (!applicant) {
      res.status(404).json({ success: false, message: 'Applicant not found' });
      return;
    }

    // --- NOTIFICATION SYNC: Update existing notifications to reflect the new stage ---
    try {
      const { updateNotificationsByReference } = await import('./notificationController.js');
      
      let notifType = 'job_application_pending';
      let notifTitle = 'Application Update';
      let notifMessage = `Applicant ${applicant.lastName}, ${applicant.firstName} stage updated to ${stage}`;

      if (stage === 'Screening') {
        notifType = 'job_application_screening';
        notifTitle = 'Application Under Review';
        notifMessage = `Applicant ${applicant.lastName}, ${applicant.firstName} is now Under Review.`;
      } else if (stage === 'Hired') {
        notifType = 'job_application_hired';
        notifTitle = 'Applicant Hired';
        notifMessage = `Congratulations! ${applicant.lastName}, ${applicant.firstName} has been Hired.`;
      } else if (stage === 'Rejected') {
        notifType = 'job_application_rejected';
        notifTitle = 'Application Rejected';
        notifMessage = `${applicant.lastName}, ${applicant.firstName} has been Rejected.`;
      } else if (stage === 'Initial Interview' || stage === 'Final Interview') {
        notifType = 'job_application_interview';
        notifTitle = 'Interview Scheduled';
        notifMessage = `Interview scheduled for ${applicant.lastName}, ${applicant.firstName} (${stage})`;
      }

      const affected = await updateNotificationsByReference({
        type: ['job_application', 'job_application_pending', 'job_application_screening', 'job_application_interview', 'job_application_hired', 'job_application_rejected'],
        referenceId: Number(id),
        title: notifTitle,
        message: notifMessage,
        newType: notifType,
        link: `/admin-dashboard/recruitment/applicants?id=${id}`,
        metadata: JSON.stringify({ applicantId: Number(id), status: stage.toLowerCase() })
      });

      if (affected === 0) {
        await notifyAdmins({
          type: notifType,
          title: notifTitle,
          message: notifMessage,
          referenceId: Number(id),
          link: `/admin-dashboard/recruitment/applicants?id=${id}`,
          metadata: JSON.stringify({ applicantId: Number(id), status: stage.toLowerCase() })
        });
      }
    } catch (notifError) {
      console.error('[RecruitmentController] Failed to sync notifications:', notifError);
    }
    try {
      const isInterviewStage = stage === 'Initial Interview' || stage === 'Final Interview';
      if (isInterviewStage && !interviewDate) {
        console.warn(`[RecruitmentController] Skipping email for ${stage} as no interviewDate was provided in this request (likely a Kanban drag).`);
      } else {
        const template = await getTemplateForStage(db, stage);
        if (template) {
          const rawVariables = {
            applicantFirstName: applicant.firstName,
            applicantLastName: applicant.lastName,
            applicantName: `${applicant.lastName}, ${applicant.firstName}`,
            jobTitle: applicant.recruitmentJob?.title || 'the position',
            interviewDate: applicant.interviewDate ? new Date(applicant.interviewDate).toLocaleString() : 'TBD',
            interviewLink: applicant.interviewLink || '#',
            interviewPlatform: applicant.interviewPlatform || 'Online',
            interviewNotes: applicant.interviewNotes || ''
          };
          
          const variables = prepareEmailVariables(rawVariables);
          const subject = replaceVariables(template.subjectTemplate, variables);
          const body = replaceVariables(template.bodyTemplate, variables);
          const attachments: { filename: string; content: string; contentType: string }[] = [];

          if (isInterviewStage && applicant.interviewDate) {
            try {
              const icsFile = await generateInterviewICS(applicant, stage, interviewDate || applicant.interviewDate || '');
              if (icsFile) {
                attachments.push({ filename: 'interview-schedule.ics', content: icsFile, contentType: 'text/calendar' });
              }
            } catch (error) {
              console.error('[RecruitmentController] Failed to generate ICS:', error);
            }
          }

          await sendEmailNotification(applicant.email, subject, body, attachments);
        } else {
          console.warn(`[RecruitmentController] No email template found for stage: ${stage}`);
        }
      }
    } catch (err: unknown) {
      console.error(`[RecruitmentController] Unexpected error in email notification:`, err instanceof Error ? err.message : 'Unknown error');
    }

    res.json({ success: true, message: 'Applicant stage updated' });

    await AuditService.log({
      userId: (req as AuthenticatedRequest).user?.id || null,
      module: 'RECRUITMENT',
      action: stage === 'Hired' ? 'HIRE' : 'UPDATE',
      details: { applicantId: id, newStage: stage },
      req
    });

  } catch (error: unknown) {
    res.status(500).json({ success: false, message: 'Failed to update stage' });
  }
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => { 
  try { 
    const { id } = req.params; 
    await db.delete(recruitmentJobs).where(eq(recruitmentJobs.id, Number(id))); 
    res.json({ success: true, message: 'Job deleted' }); 

    await AuditService.log({
      userId: (req as AuthenticatedRequest).user?.id || null,
      module: 'RECRUITMENT',
      action: 'DELETE',
      details: { jobId: id },
      req
    });

  } catch (error: unknown) { 
    res.status(500).json({ success: false, message: 'Failed to delete job' }); 
  } 
};

export const updateJob = async (req: Request, res: Response): Promise<void> => {
  try { 
    const { id } = req.params; 
    
    const parseResult = updateJobSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: parseResult.error.flatten().fieldErrors 
      });
      return;
    }

    const { title, department, jobDescription, requirements, location, status, employmentType, dutyType, applicationEmail, requireCivilService, requireGovernmentIds, requireEducationExperience, education, experience, training, eligibility, otherQualifications } = parseResult.data;
  
    const updateValues: Partial<typeof recruitmentJobs.$inferInsert> = {
      title, 
      department, 
      jobDescription: jobDescription, 
      requirements: requirements || null, 
      location, 
      status, 
      employmentType: employmentType, 
      dutyType: dutyType,
      applicationEmail: applicationEmail,
      requireCivilService: typeof requireCivilService !== 'undefined' ? (requireCivilService ? true : false) : undefined,
      requireGovernmentIds: typeof requireGovernmentIds !== 'undefined' ? (requireGovernmentIds ? true : false) : undefined,
      requireEducationExperience: typeof requireEducationExperience !== 'undefined' ? (requireEducationExperience ? true : false) : undefined,
      education: education !== undefined ? (education || null) : undefined,
      experience: experience !== undefined ? (experience || null) : undefined,
      training: training !== undefined ? (training || null) : undefined,
      eligibility: eligibility !== undefined ? (eligibility || null) : undefined,
      otherQualifications: otherQualifications !== undefined ? (otherQualifications || null) : undefined,
      updatedAt: currentManilaDateTime()
    };

    if (req.file) {
      updateValues.attachmentPath = `/uploads/general/${req.file.filename}`;
    }
    
    const currentJob = await db.query.recruitmentJobs.findFirst({
        where: eq(recruitmentJobs.id, Number(id))
    });

    if (currentJob && status === 'Open' && !currentJob.postedAt) {
        updateValues.postedAt = currentManilaDateTime();
    }

    await db.update(recruitmentJobs)
      .set(updateValues)
      .where(eq(recruitmentJobs.id, Number(id)));
      
    res.json({ success: true, message: 'Job updated successfully' }); 

    await AuditService.log({
      userId: (req as AuthenticatedRequest).user?.id || null,
      module: 'RECRUITMENT',
      action: 'UPDATE',
      details: { jobId: id, updates: Object.keys(updateValues) },
      req
    });

  } catch (error: unknown) { 
    res.status(500).json({ success: false, message: 'Failed to update job' }); 
  }
};

export const generateJobFeed = async (_req: Request, res: Response): Promise<void> => {
  try { 
    const jobs = await db.select()
      .from(recruitmentJobs)
      .where(eq(recruitmentJobs.status, 'Open'))
      .orderBy(desc(recruitmentJobs.createdAt));

      
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; 
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<source>\n'; 
    xml += `<publisher>NEBR HR System</publisher>\n<publisherurl>${baseUrl}</publisherurl>\n<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`; 
    jobs.forEach(job => { 
      const createdDate = job.createdAt ? new Date(job.createdAt).toUTCString() : new Date().toUTCString();
      xml += `<job>\n<title><![CDATA[${job.title}]]></title>\n<date><![CDATA[${createdDate}]]></date>\n<referencenumber><![CDATA[${job.id}]]></referencenumber>\n<url><![CDATA[${baseUrl}/careers/job/${job.id}]]></url>\n<company><![CDATA[Local Government of Meycauayan]]></company>\n<city><![CDATA[${job.location}]]></city>\n<state><![CDATA[Bulacan]]></state>\n<country><![CDATA[PH]]></country>\n<description><![CDATA[${job.jobDescription}]]></description>\n<category><![CDATA[${job.department}]]></category>\n</job>\n`; 
    }); 
    xml += '</source>';   
    res.header('Content-Type', 'application/xml'); 
    res.send(xml); 
  } catch (error: unknown) { 
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ success: false, message: `Failed to generate feed: ${errorMessage}` });
  }
};

export const getPotentialInterviewers = async (_req: Request, res: Response): Promise<void> => { 
  const users = await db.select({
    id: authentication.id,
    firstName: authentication.firstName,
    lastName: authentication.lastName,
    email: authentication.email,
    role: authentication.role,
    jobTitle: pdsHrDetails.jobTitle
  })
  .from(authentication)
  .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
  .where(inArray(authentication.role, ['Administrator', 'Employee']))
  .orderBy(authentication.firstName);
  
  res.json(users); 
};

export const getApplicantStats = async (_req: Request, res: Response): Promise<void> => { 
  try {
    const [stats] = await db.select({
      total: sql`count(*)`,
      pending: sql`sum(case when (${recruitmentApplicants.stage} = 'Applied' or ${recruitmentApplicants.stage} is null) and ${recruitmentApplicants.registeredEmployeeId} is null then 1 else 0 end)`,
      screening: sql`sum(case when ${recruitmentApplicants.stage} = 'Screening' and ${recruitmentApplicants.registeredEmployeeId} is null then 1 else 0 end)`,
      interviewing: sql`sum(case when ${recruitmentApplicants.stage} in ('Initial Interview', 'Final Interview') and ${recruitmentApplicants.registeredEmployeeId} is null then 1 else 0 end)`,
      hired: sql`sum(case when ${recruitmentApplicants.stage} = 'Hired' and ${recruitmentApplicants.registeredEmployeeId} is null then 1 else 0 end)`,
      rejected: sql`sum(case when ${recruitmentApplicants.stage} = 'Rejected' and ${recruitmentApplicants.registeredEmployeeId} is null then 1 else 0 end)`
    }).from(recruitmentApplicants);
    
    res.json(stats); 
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown database error';
    res.status(500).json({ success: false, message: 'Failed to fetch applicant stats', error: message });
  }
};

export const generateOfferLetter = async (req: Request, res: Response): Promise<void> => {
  try { 
    const applicantId = req.params.applicantId;
    if (!applicantId) {
      res.status(400).json({ success: false, message: 'Applicant ID is required' });
      return;
    }
    const bodyResult = generateOfferLetterSchema.safeParse(req.body);

    if (!bodyResult.success) {
      res.status(400).json({ success: false, message: 'Invalid request body', errors: bodyResult.error.flatten().fieldErrors });
      return;
    }

    const { position, salary, startDate, benefits, additionalTerms } = bodyResult.data;
    
    const applicantResult = await db.query.recruitmentApplicants.findFirst({
      where: eq(recruitmentApplicants.id, Number(applicantId)),
      with: {
        recruitmentJob: {
          columns: { title: true, department: true }
        }
      }
    });

    if (!applicantResult) { 
      res.status(404).json({ success: false, message: 'Applicant not found' }); 
      return; 
    } 
    
    const applicant = applicantResult as ApplicantWithRelations;
    const jobTitle = applicant.recruitmentJob?.title;

    const doc = new PDFDocument({ margin: 50 }); 
    const chunks: Buffer[] = []; 
    doc.on('data', (chunk: Buffer) => chunks.push(chunk)); 
    doc.on('end', () => { 
      const pdfBuffer = Buffer.concat(chunks); 
      res.setHeader('Content-Type', 'application/pdf'); 
      res.setHeader('Content-Disposition', `attachment; filename=offer_letter_${applicant.lastName}_${applicant.firstName}.pdf`); 
      res.send(pdfBuffer); 
    }); 
    doc.fontSize(20).font('Helvetica-Bold').text('OFFER OF EMPLOYMENT', { align: 'center' }); 
    doc.moveDown(2); 
    doc.fontSize(12).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`); 
    doc.moveDown(); 
    doc.text(`${applicant.lastName}, ${applicant.firstName}`); 
    doc.text(applicant.email); 
    doc.moveDown(2); 
    doc.text(`Dear ${applicant.firstName},`); 
    doc.moveDown(); 
    doc.text(`We are pleased to offer you the position of ${position || jobTitle}. We believe your skills and experience will be a valuable addition to our team.`); 
    doc.moveDown(); 
    doc.font('Helvetica-Bold').text('Terms of Employment:'); 
    doc.font('Helvetica').moveDown(0.5); 
    doc.text(`Position: ${position || jobTitle}`); 
    doc.text(`Start Date: ${startDate ? new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'To be determined'}`); 
    doc.text(`Salary: ${salary || 'As discussed'}`); 
    doc.moveDown(); 
    if (benefits) { 
      doc.font('Helvetica-Bold').text('Benefits:'); 
      doc.font('Helvetica').text(benefits); 
      doc.moveDown(); 
    } 
    if (additionalTerms) { 
      doc.font('Helvetica-Bold').text('Additional Terms:'); 
      doc.font('Helvetica').text(additionalTerms); 
      doc.moveDown(); 
    } 
    doc.font('Helvetica').text('Please sign and return this letter to accept the offer.'); 
    doc.moveDown(2); 
    doc.text('__________________________'); 
    doc.text('Authorized Signature'); 
    doc.moveDown(); 
    doc.text('__________________________'); 
    doc.text('Employee Signature'); 
    doc.end(); 
  } catch (error: unknown) { 
    res.status(500).json({ success: false, message: 'Failed to generate offer letter' }); 
  }
};

export const assignInterviewer = async (req: Request, res: Response): Promise<void> => { 
  try {
    const applicantId = req.params.applicantId;
    if (!applicantId) {
      res.status(400).json({ success: false, message: 'Applicant ID is required' });
      return;
    }
    const bodyResult = assignInterviewerSchema.safeParse(req.body);
    
    if (!bodyResult.success) {
      res.status(400).json({ success: false, message: 'Invalid interviewer details' });
      return;
    }

    const { interviewerId } = bodyResult.data;
    await db.update(recruitmentApplicants)
      .set({ interviewerId: interviewerId })
      .where(eq(recruitmentApplicants.id, Number(applicantId))); 
    res.json({ message: 'Assigned' }); 
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: 'Assignment failed' });
  }
};

export const generateMeetingLink: AuthenticatedHandler = async (req, res) => {
  const authReq = req;
  try {
    const parseResult = generateMeetingLinkSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: parseResult.error.flatten().fieldErrors 
      });
      return;
    }
    
    const { applicantId, date, duration } = parseResult.data;

    // Get applicant details
    const applicant = await db.query.recruitmentApplicants.findFirst({
      where: eq(recruitmentApplicants.id, Number(applicantId)),
      with: {
        recruitmentJob: {
          columns: { title: true }
        }
      }
    });

    if (!applicant) {
      res.status(404).json({ success: false, message: 'Applicant not found' });
      return;
    }

    const jobTitle = applicant.recruitmentJob?.title;
    const interviewDate = new Date(date);

    const result = await generateGoogleMeetLink({
      userId: authReq.user.id,
      title: `Interview: ${jobTitle || 'Position'} - ${applicant.lastName}, ${applicant.firstName}`,
      startTime: interviewDate,
      duration: duration,
      description: `Interview for ${jobTitle || 'the position'} with ${applicant.lastName}, ${applicant.firstName}`,
      attendeeEmail: applicant.email,
      attendeeName: `${applicant.lastName}, ${applicant.firstName}`
    });

    if (!result.success) {
      res.status(400).json({ success: false, message: result.error });
      return;
    }

    res.json({
      success: true,
      meetingLink: result.meetingLink,
      meetingId: result.meetingId
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: 'Failed to generate meeting link' });
  }
};

export const generateApplicationPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const applicantResult = await db.query.recruitmentApplicants.findFirst({
        where: eq(recruitmentApplicants.id, Number(id)),
        with: {
            recruitmentJob: {
                columns: {
                    title: true,
                    department: true
                }
            },
            educations: true,
            experiences: true,
            trainings: true,
            eligibilities: true
        }
    });

    if (!applicantResult) {
      res.status(404).json({ success: false, message: 'Applicant not found' });
      return;
    }

    const applicant = applicantResult as ApplicantWithRelations;

    const jobTitle = applicant.recruitmentJob?.title || 'General Application';
    const jobDepartment = applicant.recruitmentJob?.department || 'HR';

    // CRITICAL: bufferPages: true is REQUIRED for switchToPage() and bufferedPageRange()
    const doc = new PDFDocument({ 
        margin: 30, 
        size: 'LEGAL',
        bufferPages: true,
        info: {
            Subject: `Application Update - CHRMO Mey Portal`,
            Title: `Application - ${applicant.lastName}, ${applicant.firstName}`,
            Author: 'City of Meycauayan HRMO'
        }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      const safeLastName = (applicant.lastName || 'Applicant').replace(/"/g, '');
      res.setHeader('Content-Disposition', `inline; filename="application_${safeLastName}.pdf"`);
      res.send(pdfBuffer);
    });

    // --- DESIGN SYSTEM (Tabular, Black/White/Grey) ---
    const colors = {
        black: '#000000',
        grey: '#e5e5e5',
        darkGrey: '#404040',
        white: '#ffffff'
    };

    // --- HELPERS ---
    const drawBox = (x: number, y: number, w: number, h: number, label: string, value: string | number | null | undefined, fillColor?: string) => {
        if (fillColor) {
            doc.rect(x, y, w, h).fillAndStroke(fillColor, colors.black);
            doc.fillColor(colors.black);
        } else {
            doc.rect(x, y, w, h).lineWidth(0.5).strokeColor(colors.black).stroke();
        }
        
        doc.fontSize(6).font('Helvetica').fillColor(colors.black).text(label, x + 3, y + 3, { lineBreak: false });
        
        const displayValue = value?.toString() || '';
        if (displayValue) {
            doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.black).text(displayValue, x + 3, y + 12, { width: w - 6, height: h - 14, ellipsis: true });
        }
    };

    const drawLongBox = (x: number, y: number, w: number, h: number, label: string, value: string | null | undefined) => {
        doc.rect(x, y, w, h).lineWidth(0.5).strokeColor(colors.black).stroke();
        doc.fontSize(6).font('Helvetica').fillColor(colors.black).text(label, x + 3, y + 3);
        const displayValue = value || '';
        if (displayValue) {
            doc.fontSize(9).font('Helvetica').fillColor(colors.black).text(displayValue, x + 3, y + 12, { width: w - 6, height: h - 14, align: 'justify' });
        }
    };

    const drawSectionHeader = (y: number, title: string) => {
        doc.rect(30, y, doc.page.width - 60, 14).fillAndStroke(colors.grey, colors.black);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.black).text(title.toUpperCase(), 35, y + 3);
        return y + 14;
    };

    // --- HEADER ---
    const logoPath = path.join(process.cwd(), '../frontend/src/assets/meycauayan-logo.png');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 45, 35, { width: 50 });
    }

    doc.fillColor(colors.darkGrey);
    doc.fontSize(8).font('Helvetica').text('Republic of the Philippines', { align: 'center' });
    doc.fontSize(13).font('Helvetica-Bold').text('CITY GOVERNMENT OF MEYCAUAYAN', { align: 'center' });
    doc.fontSize(9).font('Helvetica').text('Province of Bulacan', { align: 'center' });
    doc.moveDown(0.8);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(colors.black).text('CITY HUMAN RESOURCE MANAGEMENT OFFICE', { align: 'center' });
    
    const dividerY = doc.y + 5;
    doc.moveTo(30, dividerY).lineTo(doc.page.width - 30, dividerY).lineWidth(2).strokeColor(colors.black).stroke();
    doc.moveTo(30, dividerY + 4).lineTo(doc.page.width - 30, dividerY + 4).lineWidth(0.5).strokeColor(colors.black).stroke();

    doc.y = dividerY + 15;

    doc.fontSize(16).font('Helvetica-Bold').fillColor(colors.black).text('Standard Application for Employment', { align: 'center' });
    doc.moveDown(0.2);
    
    // --- PHOTO BOX ROW ---
    let currentY = doc.y + 10;
    const pageWidth = doc.page.width - 60; // 552
    
    // Position/Employer logic aligned with top right photo
    const photoSize = 100;
    const infoWidth = pageWidth - photoSize;
    
    drawBox(30, currentY, infoWidth / 2, 40, 'Employer', 'CITY GOVERNMENT OF MEYCAUAYAN');
    drawBox(30 + infoWidth / 2, currentY, infoWidth / 2, 40, 'Position applying for', jobTitle);
    
    // Photo box (spans exactly 90 points height to match the 3 rows on the left)
    const photoX = 30 + infoWidth;
    doc.rect(photoX, currentY, photoSize, 90).lineWidth(0.5).strokeColor(colors.black).stroke();
    doc.fontSize(6).font('Helvetica').fillColor(colors.black).text('2x2 PHOTO', photoX, currentY + 40, { align: 'center', width: photoSize });
    
    if (applicant.photo1x1Path) {
        // 100% PRECISION: Photos are stored in uploads/resumes/ based on find-by-name result
        const photoFullPath = path.join(process.cwd(), 'uploads/resumes', applicant.photo1x1Path);
        if (fs.existsSync(photoFullPath)) {
            try {
                const photoBufferRaw = fs.readFileSync(photoFullPath);
                if (photoBufferRaw.length > 0) {
                   const photoBuffer = stripExif(photoBufferRaw);
                   // 100% PRECISION: Use Buffer for pdfkit doc.image compatibility
                   doc.image(photoBuffer, photoX + 2, currentY + 2, { width: photoSize - 4, height: 86 });
                }
            } catch (err) { 
                console.error('Error rendering applicant photo in PDF:', err);
            }
        } else {
            console.warn('[DEBUG] Photo file NOT found at:', photoFullPath);
        }
    }

    currentY += 40;
    
    // Continue info boxes next to photo
    drawBox(30, currentY, infoWidth, 25, 'Department / Category', jobDepartment);
    currentY += 25;
    
    const submittedDate = applicant.createdAt ? new Date(applicant.createdAt).toLocaleDateString() : '';
    drawBox(30, currentY, infoWidth / 3, 25, 'Ref ID', `APP-${(applicant.id || 0).toString().padStart(6, '0')}`);
    drawBox(30 + infoWidth / 3, currentY, infoWidth / 3, 25, 'Date Submitted', submittedDate);
    drawBox(30 + (infoWidth / 3) * 2, currentY, infoWidth / 3, 25, 'Source', applicant.source?.toUpperCase() || 'MANUAL');
    
    currentY += 25; // Now currentY is roughly aligned with the bottom of the photo box

    // --- PERSONAL DATA ---
    currentY = drawSectionHeader(currentY, 'PERSONAL DATA');
    
    // Name Row
    const nameColW = pageWidth / 4;
    drawBox(30, currentY, nameColW + 20, 25, 'Last Name', applicant.lastName);
    drawBox(30 + nameColW + 20, currentY, nameColW, 25, 'First Name', applicant.firstName);
    drawBox(30 + nameColW * 2 + 20, currentY, nameColW - 10, 25, 'Middle Name', applicant.middleName);
    drawBox(30 + nameColW * 3 + 10, currentY, nameColW - 10, 25, 'Suffix', applicant.suffix);
    currentY += 25;

    // Contact Row
    drawBox(30, currentY, pageWidth / 2, 25, 'Email Address', applicant.email);
    drawBox(30 + pageWidth / 2, currentY, pageWidth / 2, 25, 'Cellular Telephone Number', applicant.phoneNumber);
    currentY += 25;

    // Address Row (Residential)
    drawBox(30, currentY, pageWidth * 0.8, 25, 'Residential Address', applicant.address);
    drawBox(30 + pageWidth * 0.8, currentY, pageWidth * 0.2, 25, 'Zip', applicant.zipCode);
    currentY += 25;

    // Address Row (Permanent)
    drawBox(30, currentY, pageWidth * 0.8, 25, 'Permanent Address', applicant.permanentAddress || applicant.address);
    drawBox(30 + pageWidth * 0.8, currentY, pageWidth * 0.2, 25, 'Zip', applicant.permanentZipCode || applicant.zipCode);
    currentY += 25;

    // Bio Row
    const bioColW = pageWidth / 7;
    const bDate = applicant.birthDate ? new Date(applicant.birthDate).toLocaleDateString() : '';
    drawBox(30, currentY, bioColW, 25, 'Gender', applicant.sex);
    drawBox(30 + bioColW, currentY, bioColW, 25, 'Civil Status', applicant.civilStatus);
    drawBox(30 + bioColW * 2, currentY, bioColW * 1.5, 25, 'Birth Date', bDate);
    drawBox(30 + bioColW * 3.5, currentY, bioColW * 2, 25, 'Place of Birth', applicant.birthPlace);
    drawBox(30 + bioColW * 5.5, currentY, bioColW * 1.5, 25, 'Resident of Meycauayan?', applicant.isMeycauayanResident ? 'Yes' : 'No');
    currentY += 25;

    // Metrics Row
    drawBox(30, currentY, pageWidth / 4, 25, 'Height (m)', applicant.height);
    drawBox(30 + pageWidth / 4, currentY, pageWidth / 4, 25, 'Weight (kg)', applicant.weight);
    drawBox(30 + pageWidth / 2, currentY, pageWidth / 4, 25, 'Blood Type', applicant.bloodType);
    drawBox(30 + pageWidth * 0.75, currentY, pageWidth / 4, 25, 'Nationality', 'Filipino');
    currentY += 25;

    // --- VII. TRAINING PROGRAMS (PDS VII) ---
    const trainings = applicant.trainings || [];
    if (trainings.length > 0) {
        currentY = drawSectionHeader(currentY, 'VII. LEARNING & DEVELOPMENT (TRAINING PROGRAMS)');
        const tColW = pageWidth / 6;
        
        // Header Row for Table
        doc.rect(30, currentY, pageWidth, 12).fillAndStroke(colors.grey, colors.black);
        doc.fontSize(6).font('Helvetica-Bold').fillColor(colors.black);
        doc.text('TITLE OF TRAINING PROGRAM', 35, currentY + 3, { width: tColW * 2 });
        doc.text('INCLUSIVE DATES (FROM-TO)', 25 + tColW * 2, currentY + 3, { width: tColW * 1.5, align: 'center' });
        doc.text('HOURS', 25 + tColW * 3.5, currentY + 3, { width: tColW * 0.5, align: 'center' });
        doc.text('TYPE', 25 + tColW * 4, currentY + 3, { width: tColW * 0.5, align: 'center' });
        doc.text('CONDUCTED BY', 25 + tColW * 4.5, currentY + 3, { width: tColW * 1.5 });
        currentY += 12;

        trainings.forEach((t) => {
            if (currentY + 25 > doc.page.height - 40) {
                doc.addPage();
                currentY = 40;
            }
            const dates = `${t.dateFrom || ''} - ${t.dateTo || ''}`;
            doc.rect(30, currentY, pageWidth, 20).stroke();
            doc.fontSize(7).font('Helvetica').text(t.title || '', 35, currentY + 6, { width: tColW * 2 - 10, height: 12, ellipsis: true });
            doc.text(dates, 25 + tColW * 2, currentY + 6, { width: tColW * 1.5, align: 'center' });
            
            // Structured HOURS, TYPE, and CONDUCTOR rows
            const hours = t.hoursNumber?.toString() || '---';
            const type = t.typeOfLd || '---';
            doc.text(hours, 25 + tColW * 3.5, currentY + 6, { width: tColW * 0.5, align: 'center' });
            doc.text(type, 25 + tColW * 4, currentY + 6, { width: tColW * 0.5, align: 'center' });
            doc.text(t.conductedBy || '', 25 + tColW * 4.5, currentY + 6, { width: tColW * 1.5 - 5, ellipsis: true });
            currentY += 20;
        });
    }
    currentY += 25;

    // Emergency Row
    drawBox(30, currentY, pageWidth * 0.6, 25, 'Emergency Contact Person', applicant.emergencyContact);
    drawBox(30 + pageWidth * 0.6, currentY, pageWidth * 0.4, 25, 'Emergency Contact Number', applicant.emergencyContactNumber);
    currentY += 25;

    // --- GOVERNMENT IDENTIFIERS ---
    currentY = drawSectionHeader(currentY, 'GOVERNMENT IDENTIFIERS');
    const govColW = pageWidth / 3;
    drawBox(30, currentY, govColW, 25, 'GSIS Number', applicant.gsisNumber);
    drawBox(30 + govColW, currentY, govColW, 25, 'Pag-IBIG Number', applicant.pagibigNumber);
    drawBox(30 + govColW * 2, currentY, govColW, 25, 'PhilHealth Number', applicant.philhealthNumber);
    currentY += 25;
    drawBox(30, currentY, govColW, 25, 'UMID Number', applicant.umidNumber);
    drawBox(30 + govColW, currentY, govColW, 25, 'PhilSys ID (National ID)', applicant.philsysId);
    drawBox(30 + govColW * 2, currentY, govColW, 25, 'TIN Number', applicant.tinNumber);
    currentY += 25;

    // --- QUALIFICATIONS / EDUCATION ---
    currentY = drawSectionHeader(currentY, 'QUALIFICATIONS (Education, Training, & Eligibility)');
    
    // Education Header
    drawBox(30, currentY, pageWidth * 0.25, 14, 'Educational Level', '', colors.grey);
    drawBox(30 + pageWidth * 0.25, currentY, pageWidth * 0.35, 14, 'School/University Name', '', colors.grey);
    drawBox(30 + pageWidth * 0.60, currentY, pageWidth * 0.25, 14, 'Course / Degree', '', colors.grey);
    drawBox(30 + pageWidth * 0.85, currentY, pageWidth * 0.15, 14, 'Year Graduated', '', colors.grey);
    currentY += 14;

    // Education Data (Dynamic Rows)
    try {
        const eduLevels = ['Graduate Studies', 'College', 'Vocational', 'Secondary', 'Elementary'];
        let hasEdu = false;

        eduLevels.forEach(lvl => {
            const data = applicant.educations?.find(e => e.level === lvl);
            if (data?.schoolName) {
                hasEdu = true;
                drawBox(30, currentY, pageWidth * 0.25, 20, '', lvl);
                drawBox(30 + pageWidth * 0.25, currentY, pageWidth * 0.35, 20, '', data.schoolName);
                drawBox(30 + pageWidth * 0.60, currentY, pageWidth * 0.25, 20, '', data.degreeCourse);
                drawBox(30 + pageWidth * 0.85, currentY, pageWidth * 0.15, 20, '', data.yearGraduated);
                currentY += 20;
            }
        });

        if (!hasEdu) {
            drawBox(30, currentY, pageWidth, 20, '', 'No educational background provided');
            currentY += 20;
        }
    } catch (err) {
        console.error('PDF Education Error:', err);
        drawBox(30, currentY, pageWidth, 20, '', 'Error loading educational background');
        currentY += 20;
    }

    // Eligibility Header
    drawBox(30, currentY, pageWidth * 0.3, 14, 'Eligibility / License Name', '', colors.grey);
    drawBox(30 + pageWidth * 0.3, currentY, pageWidth * 0.25, 14, 'Rating', '', colors.grey);
    drawBox(30 + pageWidth * 0.55, currentY, pageWidth * 0.15, 14, 'Exam Date', '', colors.grey);
    drawBox(30 + pageWidth * 0.70, currentY, pageWidth * 0.30, 14, 'License No / Validity', '', colors.grey);
    currentY += 14;

    // Eligibility Data (Dynamic Rows)
    try {
        const eligs = applicant.eligibilities || [];
        if (eligs.length > 0) {
            eligs.forEach(el => {
                drawBox(30, currentY, pageWidth * 0.3, 20, '', el.eligibilityName);
                drawBox(30 + pageWidth * 0.3, currentY, pageWidth * 0.25, 20, '', el.rating ? el.rating.toString() : '');
                drawBox(30 + pageWidth * 0.55, currentY, pageWidth * 0.15, 20, '', el.examDate);
                const license = el.licenseNumber ? `${el.licenseNumber}${el.validityDate ? ' / ' + el.validityDate : ''}` : '';
                drawBox(30 + pageWidth * 0.70, currentY, pageWidth * 0.30, 20, '', license);
                currentY += 20;
            });
        } else {
             drawBox(30, currentY, pageWidth, 20, '', 'No eligibility records provided');
             currentY += 20;
        }
    } catch (err) {
        console.error('PDF Eligibility Error:', err);
        drawBox(30, currentY, pageWidth, 20, '', 'Error loading eligibility records');
        currentY += 20;
    }

    // --- EXPERIENCE & SKILLS ---
    let remainingSpace = doc.page.height - currentY - 60;
    if (remainingSpace < 200) {
        doc.addPage();
        currentY = 30;
    }

    currentY = drawSectionHeader(currentY, 'PROFESSIONAL EXPERIENCE & SPECIAL SKILLS');
    
    // Totals
    const totalTrainingHours = trainings.reduce((sum, t) => sum + (t.hoursNumber || 0), 0);
    drawBox(30, currentY, pageWidth / 2, 25, 'Total Years of Experience', applicant.totalExperienceYears);
    drawBox(30 + pageWidth / 2, currentY, pageWidth / 2, 25, 'Total Training Hours', totalTrainingHours > 0 ? totalTrainingHours.toString() : '---');
    currentY += 25;

    // Work Experience (Dynamic Rows)
    drawBox(30, currentY, pageWidth * 0.3, 14, 'Position / Company', '', colors.grey);
    drawBox(30 + pageWidth * 0.3, currentY, pageWidth * 0.2, 14, 'Inclusive Dates', '', colors.grey);
    drawBox(30 + pageWidth * 0.5, currentY, pageWidth * 0.2, 14, 'Monthly Salary / SG', '', colors.grey);
    drawBox(30 + pageWidth * 0.7, currentY, pageWidth * 0.3, 14, 'Status / Gov?', '', colors.grey);
    currentY += 14;

    try {
        const exps = applicant.experiences || [];
        if (exps.length > 0) {
            exps.forEach(exp => {
                const posComp = `${exp.positionTitle}\n${exp.companyName}`;
                const dates = `${exp.dateFrom} - ${exp.dateTo || 'Present'}`;
                const mSalary = exp.monthlySalary;
                const monthlySal = mSalary ? String(mSalary) : '---';
                const salSg = `${monthlySal}${exp.salaryGrade ? ' / ' + exp.salaryGrade : ''}`;
                const statusGov = `${exp.appointmentStatus || '---'}${exp.isGovernment ? ' (GOV)' : ''}`;

                if (currentY + 40 > doc.page.height - 60) {
                     doc.addPage();
                     currentY = 30;
                }

                drawBox(30, currentY, pageWidth * 0.3, 40, '', posComp);
                drawBox(30 + pageWidth * 0.3, currentY, pageWidth * 0.2, 40, '', dates);
                drawBox(30 + pageWidth * 0.5, currentY, pageWidth * 0.2, 40, '', salSg);
                drawBox(30 + pageWidth * 0.7, currentY, pageWidth * 0.3, 40, '', statusGov);
                currentY += 40;
            });
        } else {
            drawBox(30, currentY, pageWidth, 20, '', 'No work experience records provided');
            currentY += 20;
        }
    } catch (err) {
        console.error('PDF Experience Error:', err);
        drawBox(30, currentY, pageWidth, 20, '', 'Error loading work experience records');
        currentY += 20;
    }
    
    if (currentY + 80 > doc.page.height - 60) {
        doc.addPage();
        currentY = 30;
    }
    drawLongBox(30, currentY, pageWidth, 80, 'Core Competencies & Skills (List any special skills or experience)', applicant.skills);
    currentY += 80;

    // --- SIGNATURE BLOCK (Always at the very bottom or push to next page) ---
    remainingSpace = doc.page.height - currentY - 60;
    if (remainingSpace < 100) {
         doc.addPage();
         currentY = 30;
    }

    currentY += 20;
    doc.fontSize(8).font('Helvetica').text('I hereby certify that all information provided in this application is true, correct, and complete to the best of my knowledge.', 30, currentY, { align: 'justify', width: pageWidth });
    currentY += 40;

    // Signature Line
    doc.moveTo(30, currentY).lineTo(250, currentY).lineWidth(0.5).strokeColor(colors.black).stroke();
    doc.moveTo(doc.page.width - 250, currentY).lineTo(doc.page.width - 30, currentY).lineWidth(0.5).strokeColor(colors.black).stroke();
    
    currentY += 5;
    doc.fontSize(8).font('Helvetica').text('Signature of Applicant', 30, currentY, { width: 220, align: 'center' });
    doc.text('Date Signed', doc.page.width - 250, currentY, { width: 220, align: 'center' });

    // --- ADD BORDERS TO ALL PAGES ---
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    // Outer Page Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(1.5).strokeColor(colors.black).stroke();
    doc.rect(22, 22, doc.page.width - 44, doc.page.height - 44).lineWidth(0.5).strokeColor(colors.black).stroke();

    doc.fontSize(6).fillColor(colors.darkGrey).text(
        `Page ${i + 1} of ${range.count} | Form Generated via System`,
        30, doc.page.height - 35, { align: 'right', width: pageWidth }
    );
    }

    doc.end();
    } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: `Failed to generate PDF: ${errorMessage}` });
    }
    };

    export const confirmHiredApplicant: AuthenticatedHandler = async (req, res) => {
    try {
    const { id } = req.params;
    const parseResult = confirmHiredSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, message: 'Invalid request body', errors: parseResult.error.flatten().fieldErrors });
      return;
    }
    const { startDate, selectedDocs, customNotes } = parseResult.data;

    if (!startDate) {
    res.status(400).json({ success: false, message: 'Start date is required' });
    return;
    }

    const [applicant] = await db.select()
    .from(recruitmentApplicants)
    .where(eq(recruitmentApplicants.id, Number(id)))
    .limit(1);

    if (!applicant) {
    res.status(404).json({ success: false, message: 'Applicant not found' });
    return;
    }

    if (applicant.stage !== 'Hired') {
    res.status(400).json({ success: false, message: 'Only hired applicants can be confirmed for duty' });
    return;
    }

    // 1. Data Migration: Mark as confirmed and move to Archived Hired
    await db.update(recruitmentApplicants)
    .set({
        isConfirmed: true,
        startDate: startDate,
        stage: 'Hired', 
        status: 'Hired'
    })
    .where(eq(recruitmentApplicants.id, Number(id)));

    // 2. Dispatch "Start of Duty" Email with Attachments
    try {
    const template = await getTemplateForStage(db, 'Confirmed');
    const job = await db.query.recruitmentJobs.findFirst({ where: eq(recruitmentJobs.id, applicant.jobId || 0) });

    const formattedStart = new Date(startDate).toLocaleString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', hour12: true 
    });

    const rawVariables = {
        applicantFirstName: applicant.firstName,
        applicantLastName: applicant.lastName,
        jobTitle: job?.title || 'the position',
        startDate: formattedStart,
        department: job?.department || 'HR'
    };

    const variables = prepareEmailVariables(rawVariables);

    let subject = `Start of Duty Notification - ${variables.jobTitle}`;
    let body = `Dear ${applicant.firstName},\n\nCongratulations! We are pleased to inform you that your official start date is ${variables.startDate}. Please proceed to Office of the City Human Resource Management Officer to register your initial data from your application form.`;

    if (customNotes) {
        body += `\n\nAdditional Instructions from HR:\n${customNotes}`;
    }

    body += `\n\nBest regards,\nOffice of the City Human Resource Management Officer`;

    if (template) {
        subject = replaceVariables(template.subjectTemplate, variables);
        body = replaceVariables(template.bodyTemplate, variables);
    }

    // Process Attachments
    const attachments: { filename: string; path: string }[] = [];
    if (selectedDocs && selectedDocs.length > 0) {
        for (const docPath of selectedDocs) {
            const fullPath = path.join(process.cwd(), 'uploads/resumes', docPath);
            if (fs.existsSync(fullPath)) {
                attachments.push({
                    filename: docPath.split('-').pop() || 'document.pdf',
                    path: fullPath
                });
            }
        }
    }

    await sendEmailNotification(applicant.email, subject, body, attachments);
    } catch (emailErr: unknown) { // Harden catch block
    console.error('[RecruitmentController] Confirm email failed:', emailErr);
    }

    res.status(200).json({ success: true, message: 'Applicant confirmed and notification sent.' });

    await AuditService.log({
      userId: (req as AuthenticatedRequest).user?.id || null,
      module: 'RECRUITMENT',
      action: 'HIRE',
      details: { applicantId: id, startDate },
      req
    });

  } catch (error: unknown) { // Harden catch block
    console.error('[RecruitmentController] confirmHiredApplicant failed:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm applicant' });
  }
};

export const generatePhotoPDF = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const applicantResult = await db.query.recruitmentApplicants.findFirst({
            where: eq(recruitmentApplicants.id, Number(id))
        });

        if (!applicantResult || !applicantResult.photo1x1Path) {
            res.status(404).json({ success: false, message: '2x2 Photo not found' });
            return;
        }

        const applicant = applicantResult as ApplicantWithRelations;

        const photoFullPath = path.join(process.cwd(), 'uploads/resumes', applicant.photo1x1Path || '');
        if (!fs.existsSync(photoFullPath)) {
            res.status(404).json({ success: false, message: 'Physical photo file missing' });
            return;
        }

        const sizeInPts = 144; // 2 inches
        
        const doc = new PDFDocument({ 
            size: [sizeInPts + 20, sizeInPts + 40],
            margin: 10 
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="2x2_photo_${applicant.lastName}.pdf"`);
            res.send(pdfBuffer);
        });

        doc.fontSize(8).font('Helvetica-Bold').text(`OFFICIAL 2x2 PHOTO`, { align: 'center' });
        doc.moveDown(0.5);
        
        try {
            doc.image(photoFullPath, 10, doc.y, { width: sizeInPts, height: sizeInPts });
            doc.rect(10, doc.y, sizeInPts, sizeInPts).lineWidth(0.5).strokeColor('#000000').stroke();
        } catch {
            doc.text('Error loading image', { align: 'center' });
        }

        doc.end();
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: 'Failed to generate photo PDF' });
    }
};

export const saveInterviewNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = saveInterviewNotesSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors
      });
      return;
    }

    const { applicantId, notes } = parseResult.data;
 
    // Use interview_notes column
    await db.update(recruitmentApplicants)
      .set({ interviewNotes: notes || '' })
      .where(eq(recruitmentApplicants.id, Number(applicantId)));

    res.json({ success: true, message: 'Interview notes saved successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ success: false, message: `Failed to save notes: ${errorMessage}` });
  }
};

export const getSecurityLogs = async (_req: Request, res: Response): Promise<void> => {
    try {
        const logs = await db.select({
            id: recruitmentSecurityLogs.id,
            jobId: recruitmentSecurityLogs.jobId,
            firstName: recruitmentSecurityLogs.firstName,
            lastName: recruitmentSecurityLogs.lastName,
            email: recruitmentSecurityLogs.email,
            violationType: recruitmentSecurityLogs.violationType,
            details: recruitmentSecurityLogs.details,
            ipAddress: recruitmentSecurityLogs.ipAddress,
            createdAt: recruitmentSecurityLogs.createdAt,
            jobTitle: recruitmentJobs.title
        })
        .from(recruitmentSecurityLogs)
        .leftJoin(recruitmentJobs, eq(recruitmentSecurityLogs.jobId, recruitmentJobs.id))
        .orderBy(desc(recruitmentSecurityLogs.createdAt))
        .limit(100);

        res.status(200).json({ success: true, logs });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: 'Failed to fetch security logs' });
    }
};

export const deleteApplicant = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const applicantId = Number(id);

        if (isNaN(applicantId)) {
            res.status(400).json({ success: false, message: 'Invalid applicant ID' });
            return;
        }

        // Fetch the applicant to check their current stage
        const [applicant] = await db.select({
            stage: recruitmentApplicants.stage
        }).from(recruitmentApplicants).where(eq(recruitmentApplicants.id, applicantId));

        if (!applicant) {
            res.status(404).json({ success: false, message: 'Applicant not found' });
            return;
        }

        // Ensure only rejected applicants can be deleted (optional but good practice)
        if (applicant.stage !== 'Rejected') {
            res.status(400).json({ success: false, message: 'Only rejected/archived applicants can be permanently deleted.' });
            return;
        }

        await db.delete(recruitmentApplicants).where(eq(recruitmentApplicants.id, applicantId));
        
        res.status(200).json({ success: true, message: 'Applicant permanently deleted' });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: 'Failed to delete applicant' });
    }
};

/**
 * Verify Applicant Email via OTP
 */
export const verifyApplicantOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { applicantId, otp } = verifyOTPSchema.parse(req.body);

        const [applicant] = await db.select()
            .from(recruitmentApplicants)
            .where(eq(recruitmentApplicants.id, applicantId))
            .limit(1);

        if (!applicant) {
            res.status(404).json({ success: false, message: 'Applicant not found' });
            return;
        }

        if (applicant.verificationToken !== otp) {
            res.status(400).json({ success: false, message: 'Invalid verification code' });
            return;
        }

        await db.update(recruitmentApplicants)
            .set({ 
                isEmailVerified: true, 
                verificationToken: null 
            })
            .where(eq(recruitmentApplicants.id, applicantId));

        res.status(200).json({ 
            success: true, 
            message: 'Email verified successfully! Your application is now being processed.' 
        });
    } catch (error: unknown) {
        console.error('[RecruitmentController] verifyApplicantOTP failed:', error);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
};
