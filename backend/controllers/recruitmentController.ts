import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { recruitmentJobs, recruitmentApplicants, authentication, recruitmentSecurityLogs } from '../db/schema.js';
import { eq, and, sql, desc, or, inArray, isNull, getTableColumns } from 'drizzle-orm';
/* eslint-disable-next-line @typescript-eslint/naming-convention */
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import * as ics from 'ics';
import { getTemplateForStage, replaceVariables, sendEmailNotification } from '../utils/emailHelpers.js';
import { generateGoogleMeetLink } from '../services/meetingService.js';
import { currentManilaDateTime } from '../utils/dateUtils.js';
import { sanitizeInput, isDisposableEmail } from '../utils/spamUtils.js';
import type { JobStatus, ApplicantStage, ApplicantStatus } from '../types/index.js';

import {
  createJobSchema,
  updateJobSchema,
  updateApplicantStageSchema,
  generateMeetingLinkSchema,
  saveInterviewNotesSchema,
  generateOfferLetterSchema,
  assignInterviewerSchema,
  createStrictApplyJobSchema
} from '../schemas/recruitmentSchema.js';
import { 
  verifyFileHeader, 
  verifyEmailDomain, 
  logSecurityViolation 
} from '../utils/recruitmentUtils.js';
import { 
  checkDuplicateApplication, 
  sendApplicationNotifications 
} from '../services/recruitmentService.js';
import type { AuthenticatedHandler } from '../types/index.js';

function isApplicantStage(val: string): val is ApplicantStage {
  return ['Applied', 'Screening', 'Initial Interview', 'Final Interview', 'Offer', 'Hired', 'Rejected'].includes(val);
}

export const getHiredByDuty: AuthenticatedHandler = async (req, res) => {
  try {
    const { duty, department } = req.query; // 'Standard' | 'Irregular Duties', 'Department Name'

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
    const targetTypes = (normalizedDuty === 'Standard' ? [...standardTypes] : [...irregularTypes]);

    const andConditions = [
        eq(recruitmentApplicants.isConfirmed, true),
        eq(recruitmentApplicants.stage, 'Hired'),
        or(
          inArray(recruitmentJobs.employmentType, targetTypes as ("Full-time" | "Part-time" | "Contractual" | "Job Order" | "Coterminous" | "Temporary" | "Probationary" | "Casual" | "Permanent" | "Contract of Service" | "JO" | "COS")[]),
          eq(recruitmentJobs.dutyType, normalizedDuty as 'Standard' | 'Irregular')
        )
    ];

    if (department && typeof department === 'string') {
        andConditions.push(eq(recruitmentJobs.department, department));
    }

    // Fetch hired applicants whose job corresponds to the target employment types OR the duty type category
    const results = await db.select({
      applicant: recruitmentApplicants,
      job: recruitmentJobs
    })
    .from(recruitmentApplicants)
    .innerJoin(recruitmentJobs, eq(recruitmentApplicants.jobId, recruitmentJobs.id))
    .where(and(...andConditions))
    .orderBy(desc(recruitmentApplicants.hiredDate));

    // Refined filtering: Only hide if ALREADY LINKED to an employee ID.
    // This allows test accounts with same email to show up as separate applicants.
    const filteredApplicants = results
      .filter(row => !row.applicant.registeredEmployeeId)
      .map(row => ({
        id: row.applicant.id,
        firstName: row.applicant.firstName,
        lastName: row.applicant.lastName,
        middleName: row.applicant.middleName,
        suffix: row.applicant.suffix,
        email: row.applicant.email,
        phoneNumber: row.applicant.phoneNumber,
        photoPath: row.applicant.photoPath,
        birthDate: row.applicant.birthDate,
        birthPlace: row.applicant.birthPlace,
        sex: row.applicant.sex,
        civilStatus: row.applicant.civilStatus,
        height: row.applicant.height,
        weight: row.applicant.weight,
        bloodType: row.applicant.bloodType,
        gsisNumber: row.applicant.gsisNumber,
        pagibigNumber: row.applicant.pagibigNumber,
        philhealthNumber: row.applicant.philhealthNumber,
        umidNumber: row.applicant.umidNumber,
        philsysId: row.applicant.philsysId,
        tinNumber: row.applicant.tinNumber,
        eligibility: row.applicant.eligibility,
        eligibilityType: row.applicant.eligibilityType,
        eligibilityDate: row.applicant.eligibilityDate,
        eligibilityRating: row.applicant.eligibilityRating,
        eligibilityPlace: row.applicant.eligibilityPlace,
        licenseNo: row.applicant.licenseNo,
        address: row.applicant.address,
        zipCode: row.applicant.zipCode,
        permanentAddress: row.applicant.permanentAddress,
        permanentZipCode: row.applicant.permanentZipCode,
        isMeycauayanResident: row.applicant.isMeycauayanResident,
        educationalBackground: row.applicant.educationalBackground,
        schoolName: row.applicant.schoolName,
        course: row.applicant.course,
        yearGraduated: row.applicant.yearGraduated,
        experience: row.applicant.experience,
        skills: row.applicant.skills,
        totalExperienceYears: row.applicant.totalExperienceYears,
        hiredDate: row.applicant.hiredDate,
        emergencyContact: row.applicant.emergencyContact,
        emergencyContactNumber: row.applicant.emergencyContactNumber,
        jobTitle: row.job.title,
        employmentType: row.job.employmentType,
        dutyType: row.job.dutyType
      }));

    res.status(200).json({ success: true, applicants: filteredApplicants });
  } catch (error) {

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: 'Failed to fetch hired applicants', error: errorMessage });
  }
};

export const createJob: AuthenticatedHandler = async (req, res) => {
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
      employmentType: employmentType as "Full-time" | "Part-time" | "Contractual" | "Job Order" | "Coterminous" | "Temporary" | "Probationary" | "Casual" | "Permanent",
      dutyType: dutyType as "Standard" | "Irregular",
      applicationEmail: applicationEmail,
      status: jobStatus as "Open" | "Closed" | "On Hold",
      attachmentPath: attachmentPath,
      requireCivilService: requireCivilService,
      requireGovernmentIds: requireGovernmentIds,
      requireEducationExperience: requireEducationExperience,
      education: education || null,
      experience: experience || null,
      training: training || null,
      eligibility: eligibility || null,
      otherQualifications: otherQualifications || null,
      postedBy: req.user.id,
      postedAt: postedAt,
      createdAt: currentManilaDateTime()
    });

    res.status(201).json({ success: true, message: 'Job posted successfully' });
  } catch (error) {
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
  } catch (error) {
    console.error('[RecruitmentController] getJobs failed:', error);
    const err = error instanceof Error ? error : new Error('Unknown database error');

    res.status(500).json({ success: false, message: 'Failed to fetch jobs', error: err.message });
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
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Failed to fetch job' });
  }
};

export const applyJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId: reqJobId } = req.body as { jobId?: unknown };
    if (!reqJobId) {
        res.status(400).json({ success: false, message: 'jobId is required' });
        return;
    }

    const jobConfig = await db.query.recruitmentJobs.findFirst({ where: eq(recruitmentJobs.id, Number(reqJobId)) });
    if (!jobConfig) {
        res.status(404).json({ success: false, message: 'Job not found' });
        return;
    }

    const isPermanent = jobConfig.employmentType === 'Permanent';
    const requireIds = isPermanent || jobConfig.requireGovernmentIds === true;
    const requireCsc = isPermanent || jobConfig.requireCivilService === true;
    const requireEdu = isPermanent || jobConfig.requireEducationExperience === true;

    const dynamicSchema = createStrictApplyJobSchema(Boolean(requireIds), Boolean(requireCsc), Boolean(requireEdu));
    const parseResult = dynamicSchema.safeParse(req.body);

    if (!parseResult.success) {
       res.status(400).json({ success: false, message: 'Validation failed', errors: parseResult.error.flatten().fieldErrors });
       return;
    }

    const {
      jobId, firstName, lastName, middleName, suffix, email, phoneNumber,
      address, zipCode, permanentAddress, permanentZipCode, isMeycauayanResident,
      birthDate, birthPlace, sex, civilStatus, height,
      weight, bloodType, gsisNumber, pagibigNumber, philhealthNumber, umidNumber, philsysId, tinNumber,
      eligibility, eligibilityType, eligibilityDate, eligibilityRating, eligibilityPlace, licenseNo, totalExperienceYears,
      educationalBackground, schoolName, yearGraduated, course, experience, skills, emergencyContact, emergencyContactNumber,
      resRegion, resProvince, resCity, resBrgy, resHouseBlockLot, resSubdivision, resStreet,
      permRegion, permProvince, permCity, permBrgy, permHouseBlockLot, permSubdivision, permStreet
    } = parseResult.data;

    const { hpField, websiteUrl, hToken } = req.body as { hpField?: string; websiteUrl?: string; hToken?: string };

    // File Integrity Audit
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
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

    // CSC Compliance Check
    const isCSCRequired = ['Permanent', 'Temporary', 'Probationary'].includes(jobConfig.employmentType || '');
    if (isCSCRequired) {
        if (!eligibilityType || !eligibilityDate) {
            res.status(400).json({ success: false, message: 'CSC/Permanent positions require precise Eligibility details (Type and Date).' });
            return;
        }
        if (!eligibilityCert) {
            res.status(400).json({ success: false, message: 'CSC/Permanent positions require a Certificate of Eligibility upload.' });
            return;
        }
    }

    // Spam Guard: Honeypot & Human Token
    if (hpField || websiteUrl) {
        await logSecurityViolation({
            jobId: Number(jobId), firstName: firstName, lastName: lastName, email,
            violationType: 'Spam Bot', details: `Honeypot filled (${hpField ? 'Primary' : 'Secondary'})`,
            ipAddress: req.ip || 'Unknown'
        });
        res.status(201).json({ success: true, message: 'Application submitted successfully' });
        return;
    }

    if (!hToken || !hToken.startsWith('v-')) {
        await logSecurityViolation({
            jobId: Number(jobId), firstName: firstName, lastName: lastName, email,
            violationType: 'Automated Script', details: `Missing/invalid human token '${hToken}'`,
            ipAddress: req.ip || 'Unknown'
        });
        res.status(400).json({ success: false, message: 'Security protocol failed. Please use a real browser.' });
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

    // Duplicate & Identity Fraud Check
    const existingApplication = await checkDuplicateApplication({
        firstName, lastName, middleName, suffix, email, birthDate, tinNumber, gsisNumber, philsysId
    });

    if (existingApplication) {
        const isIdentityFraud = (existingApplication.tinNumber === tinNumber && tinNumber) &&
                                (existingApplication.firstName !== firstName || existingApplication.lastName !== lastName);

        if (isIdentityFraud) {
            await logSecurityViolation({
                jobId: Number(jobId), firstName: firstName, lastName: lastName, email,
                violationType: 'Identity Fraud', details: `ID ${tinNumber} mismatch with name`,
                ipAddress: req.ip || 'Unknown'
            });
            res.status(409).json({ success: false, message: 'Identity verification failed. This ID is already registered.' });
            return;
        }

        res.status(409).json({ success: false, message: 'You have recently applied. Please wait 3 months before submitting a new application.' });
        return;
    }

    // Process Application
    const [insertedApplicant] = await db.insert(recruitmentApplicants).values({
        jobId: Number(jobId),
        firstName: sanitizeInput(firstName),
        lastName: sanitizeInput(lastName),
        middleName: middleName ? sanitizeInput(middleName) : null,
        suffix: suffix ? sanitizeInput(suffix) : null,
        email,
        phoneNumber: phoneNumber,
        address: sanitizeInput(address),
        zipCode: zipCode,
        permanentAddress: permanentAddress ? sanitizeInput(permanentAddress) : null,
        permanentZipCode: permanentZipCode,
        isMeycauayanResident: isMeycauayanResident ? true : false,
        birthDate: birthDate,
        birthPlace: sanitizeInput(birthPlace),
        sex: sex as "Male" | "Female",
        civilStatus: civilStatus as "Single" | "Married" | "Widowed" | "Separated" | "Annulled",
        height,
        weight,
        bloodType: bloodType,
        gsisNumber: gsisNumber,
        pagibigNumber: pagibigNumber,
        philhealthNumber: philhealthNumber,
        umidNumber: umidNumber,
        philsysId: philsysId,
        tinNumber: tinNumber,
        eligibility: eligibility ? sanitizeInput(eligibility) : null,
        eligibilityType: eligibilityType as string,
        eligibilityDate: eligibilityDate,
        eligibilityRating: eligibilityRating,
        eligibilityPlace: eligibilityPlace ? sanitizeInput(eligibilityPlace) : null,
        licenseNo: licenseNo,
        eligibilityPath: eligibilityCert?.filename || null,
        totalExperienceYears: totalExperienceYears,
        educationalBackground: educationalBackground ? sanitizeInput(educationalBackground) : null,
        schoolName: schoolName ? sanitizeInput(schoolName) : null,
        yearGraduated: yearGraduated || null,
        course: course ? sanitizeInput(course) : null,
        experience: experience ? sanitizeInput(experience) : null,
        skills: skills ? sanitizeInput(skills) : null,
        emergencyContact: emergencyContact ? sanitizeInput(emergencyContact) : null,
        emergencyContactNumber: emergencyContactNumber || null,
        resumePath: resume?.filename || null,
        photoPath: photo?.filename || null,
        resRegion: resRegion || null,
        resProvince: resProvince || null,
        resCity: resCity || null,
        resBarangay: resBrgy || null,
        resHouseBlockLot: resHouseBlockLot || null,
        resSubdivision: resSubdivision || null,
        resStreet: resStreet || null,
        permRegion: permRegion || null,
        permProvince: permProvince || null,
        permCity: permCity || null,
        permBarangay: permBrgy || null,
        permHouseBlockLot: permHouseBlockLot || null,
        permSubdivision: permSubdivision || null,
        permStreet: permStreet || null,
        createdAt: currentManilaDateTime()
    }).$returningId();

    const applicantId = (insertedApplicant as unknown as { insertId: number }).insertId;

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
        const fld = (d: PDFKit.PDFDocument, l: string, v: unknown, x: number, y: number, w: number) => {
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
    } catch (_pdfErr) {
        // Continue application even if PDF save fails, but log it
    }

    // Trigger Notifications
    await sendApplicationNotifications({ jobId: Number(jobId), firstName: firstName, lastName: lastName, email });

    res.status(201).json({ success: true, message: 'Application submitted successfully' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit application', 
      error: error instanceof Error ? error.message : 'Internal Server Error' 
    });
  }
};


export const getApplicants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId, stage, source } = req.query;

    // --- 100% AUDIT & SELF-HEALING: DATA INTEGRITY BLOCK ---
    try {
        // Fix legacy applicants who have a hiredDate but were incorrectly marked as 'Rejected'
        // This restores their semantic integrity to 'Hired' while keeping them Archived via isConfirmed
        await db.update(recruitmentApplicants)
            .set({ 
                stage: 'Hired', 
                status: 'Hired',
                isConfirmed: true 
            })
            .where(
                and(
                    eq(recruitmentApplicants.stage, 'Rejected'),
                    sql`${recruitmentApplicants.hiredDate} IS NOT NULL`
                )
            );
    } catch (healError) {
        console.error('[RecruitmentController] Self-healing failed:', healError);
    }

    // --- AUTO-ARCHIVE HIRED APPLICANTS AFTER 3 DAYS ---
    try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const threeDaysAgoStr = threeDaysAgo.toISOString().slice(0, 19).replace('T', ' ');

        // Update applicants who were hired more than 3 days ago to be Confirmed/Archived, keeping stage 'Hired'
        await db.update(recruitmentApplicants)
            .set({ 
                isConfirmed: true
            })
            .where(
                and(
                    eq(recruitmentApplicants.stage, 'Hired'),
                    eq(recruitmentApplicants.isConfirmed, false),
                    sql`${recruitmentApplicants.hiredDate} <= ${threeDaysAgoStr}`
                )
            );
    } catch (archiveError) {
        console.error('[RecruitmentController] Auto-archive failed:', archiveError);
        // Continue even if archiving fails
    }

    const conditions = [];
    if (jobId && typeof jobId === 'string' && !isNaN(Number(jobId))) {
      conditions.push(eq(recruitmentApplicants.jobId, Number(jobId)));
    }

    if (stage && typeof stage === 'string') {
      const stageStr = stage;
      if (stageStr === 'Pending') {
        conditions.push(or(eq(recruitmentApplicants.stage, 'Applied'), isNull(recruitmentApplicants.stage)));
      } else if (stageStr === 'Reviewed') {
        conditions.push(eq(recruitmentApplicants.stage, 'Screening'));
      } else if (stageStr === 'Interview') {
        conditions.push(inArray(recruitmentApplicants.stage, ['Initial Interview', 'Final Interview']));
      } else if (isApplicantStage(stageStr)) {
        conditions.push(eq(recruitmentApplicants.stage, stageStr));
      }
    }

    if (source && typeof source === 'string' && source !== 'All') {
      const sourceStr = source.toLowerCase();
      if (sourceStr === 'web' || sourceStr === 'email') {
        conditions.push(eq(recruitmentApplicants.source, sourceStr));
      }
    }

    const applicants = await db.select({
      id: recruitmentApplicants.id,
      jobId: recruitmentApplicants.jobId,
      firstName: recruitmentApplicants.firstName,
      lastName: recruitmentApplicants.lastName,
      middleName: recruitmentApplicants.middleName,
      suffix: recruitmentApplicants.suffix,
      email: recruitmentApplicants.email,
      phoneNumber: recruitmentApplicants.phoneNumber,
      resumePath: recruitmentApplicants.resumePath,
      photoPath: recruitmentApplicants.photoPath,
      stage: recruitmentApplicants.stage,
      status: recruitmentApplicants.status,
      address: recruitmentApplicants.address,
      permanentAddress: recruitmentApplicants.permanentAddress,
      zipCode: recruitmentApplicants.zipCode,
      permanentZipCode: recruitmentApplicants.permanentZipCode,
      resHouseBlockLot: recruitmentApplicants.resHouseBlockLot,
      resStreet: recruitmentApplicants.resStreet,
      resSubdivision: recruitmentApplicants.resSubdivision,
      resBarangay: recruitmentApplicants.resBarangay,
      resCity: recruitmentApplicants.resCity,
      resProvince: recruitmentApplicants.resProvince,
      resRegion: recruitmentApplicants.resRegion,
      permHouseBlockLot: recruitmentApplicants.permHouseBlockLot,
      permStreet: recruitmentApplicants.permStreet,
      permSubdivision: recruitmentApplicants.permSubdivision,
      permBarangay: recruitmentApplicants.permBarangay,
      permCity: recruitmentApplicants.permCity,
      permProvince: recruitmentApplicants.permProvince,
      permRegion: recruitmentApplicants.permRegion,
      isMeycauayanResident: recruitmentApplicants.isMeycauayanResident,
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
      eligibility: recruitmentApplicants.eligibility,
      eligibilityType: recruitmentApplicants.eligibilityType,
      eligibilityDate: recruitmentApplicants.eligibilityDate,
      eligibilityRating: recruitmentApplicants.eligibilityRating,
      eligibilityPlace: recruitmentApplicants.eligibilityPlace,
      licenseNo: recruitmentApplicants.licenseNo,
      eligibilityPath: recruitmentApplicants.eligibilityPath,
      educationalBackground: recruitmentApplicants.educationalBackground,
      experience: recruitmentApplicants.experience,
      skills: recruitmentApplicants.skills,
      emergencyContact: recruitmentApplicants.emergencyContact,
      emergencyContactNumber: recruitmentApplicants.emergencyContactNumber,
      interviewDate: recruitmentApplicants.interviewDate,
      interviewLink: recruitmentApplicants.interviewLink,
      interviewPlatform: recruitmentApplicants.interviewPlatform,
      interviewNotes: recruitmentApplicants.interviewNotes,
      source: recruitmentApplicants.source,
      createdAt: recruitmentApplicants.createdAt,
      hiredDate: recruitmentApplicants.hiredDate,
      startDate: recruitmentApplicants.startDate,
      isConfirmed: recruitmentApplicants.isConfirmed,
      jobTitle: sql`COALESCE(${recruitmentJobs.title}, 'General Application')`,
      jobRequirements: sql`COALESCE(${recruitmentJobs.requirements}, '')`,
      jobDepartment: sql`COALESCE(${recruitmentJobs.department}, 'HR')`,
      jobStatus: sql`COALESCE(${recruitmentJobs.status}, 'Open')`,
      jobEmploymentType: sql`COALESCE(${recruitmentJobs.employmentType}, 'Full-time')`,
      jobDutyType: sql`COALESCE(${recruitmentJobs.dutyType}, 'Standard')`,
      interviewerName: sql`TRIM(CONCAT(${authentication.lastName}, ', ', ${authentication.firstName}, IF(${authentication.middleName} IS NOT NULL && ${authentication.middleName} != '', CONCAT(' ', SUBSTRING(${authentication.middleName}, 1, 1), '.'), ''), IF(${authentication.suffix} IS NOT NULL && ${authentication.suffix} != '', CONCAT(' ', ${authentication.suffix}), '')))`
    })
    .from(recruitmentApplicants)
    .leftJoin(recruitmentJobs, eq(recruitmentApplicants.jobId, recruitmentJobs.id))
    .leftJoin(authentication, eq(recruitmentApplicants.interviewerId, authentication.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(recruitmentApplicants.createdAt));

    res.json({ success: true, applicants });
  } catch (error) {

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
    /* eslint-disable @typescript-eslint/naming-convention */
    const statusMap: Record<ApplicantStage, ApplicantStatus> = {
      'Applied': 'Applied',
      'Screening': 'Screening',
      'Initial Interview': 'Interview',
      'Final Interview': 'Interview',
      'Offer': 'Offer',
      'Hired': 'Hired',
      'Rejected': 'Rejected'
    };
    /* eslint-enable @typescript-eslint/naming-convention */

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
    
    const applicant = await db.query.recruitmentApplicants.findFirst({
      where: eq(recruitmentApplicants.id, Number(id)),
      with: {
        recruitmentJob: { columns: { title: true } }
      }
    });
    
    if (applicant) {

      try {
        const template = await getTemplateForStage(db, stage);
        
        if (template) {
          const variables = {
            applicantFirstName: applicant.firstName,
            applicantLastName: applicant.lastName,
            jobTitle: applicant.recruitmentJob?.title || 'the position',
            interviewDate: interviewDate ? new Date(interviewDate).toLocaleString() : 'TBD',
            interviewLink: interviewLink || '#',
            interviewPlatform: interviewPlatform || 'Online',
            interviewNotes: notes || ''
          };
          
          const subject = replaceVariables(template.subjectTemplate, variables);
          const body = replaceVariables(template.bodyTemplate, variables);
          
          const attachments: { filename: string; content: string; contentType: string }[] = [];
          
          if ((stage === 'Initial Interview' || stage === 'Final Interview') && interviewDate) {
            try {
              const dateObj = new Date(interviewDate);
              const event: ics.EventAttributes = {
                start: [dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate(), dateObj.getHours(), dateObj.getMinutes()],
                duration: { minutes: 60 },
                title: `Interview: ${applicant.recruitmentJob?.title} - ${applicant.firstName}`,
                description: `Interview for ${applicant.recruitmentJob?.title}. Platform: ${interviewPlatform}. Link: ${interviewLink}`,
                location: interviewPlatform ? interviewLink : 'Office',
                url: interviewLink,
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
                organizer: { name: 'Office of the City Human Resource Management Officer', email: process.env.EMAIL_USER || '' },
                attendees: [{ name: `${applicant.firstName} ${applicant.lastName}`, email: applicant.email, rsvp: true }]
              };
              const { error, value } = ics.createEvent(event);
              if (!error && value) {
                attachments.push({ filename: 'invite.ics', content: value, contentType: 'text/calendar' });
              }
            } catch (_icsErr) {
      /* empty */

            }
          }
          
          await sendEmailNotification(applicant.email, subject, body, attachments);
        }
      } catch (_emailErr) {
      /* empty */

      }
    }
    
    res.json({ success: true, message: 'Applicant stage updated' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to update stage' });
  }
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => { 
  try { 
    const { id } = req.params; 
    await db.delete(recruitmentJobs).where(eq(recruitmentJobs.id, Number(id))); 
    res.json({ success: true, message: 'Job deleted' }); 
  } catch (_error) { 
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
      dutyType: dutyType as "Standard" | "Irregular",
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
  } catch (_error) { 

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
  } catch (error) { 
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
    jobTitle: authentication.jobTitle
  })
  .from(authentication)
  .where(inArray(authentication.role, ['Administrator', 'Employee']))
  .orderBy(authentication.firstName);
  
  res.json(users); 
};

export const getApplicantStats = async (_req: Request, res: Response): Promise<void> => { 
  try {
    const [stats] = await db.select({
      total: sql`count(*)`,
      pending: sql`sum(case when ${recruitmentApplicants.stage} = 'Applied' or ${recruitmentApplicants.stage} is null then 1 else 0 end)`,
      screening: sql`sum(case when ${recruitmentApplicants.stage} = 'Screening' then 1 else 0 end)`,
      interviewing: sql`sum(case when ${recruitmentApplicants.stage} in ('Initial Interview', 'Final Interview') then 1 else 0 end)`,
      hired: sql`sum(case when ${recruitmentApplicants.stage} = 'Hired' then 1 else 0 end)`,
      rejected: sql`sum(case when ${recruitmentApplicants.stage} = 'Rejected' then 1 else 0 end)`
    }).from(recruitmentApplicants);
    
    res.json(stats); 
  } catch (error) {

    const message = error instanceof Error ? error.message : 'Unknown database error';
    res.status(500).json({ success: false, message: 'Failed to fetch applicant stats', error: message });
  }
};

export const generateOfferLetter = async (req: Request, res: Response): Promise<void> => {
  try { 
    const { applicantId } = req.params as { applicantId: string };
    const bodyResult = generateOfferLetterSchema.safeParse(req.body);

    if (!bodyResult.success) {
      res.status(400).json({ success: false, message: 'Invalid request body', errors: bodyResult.error.flatten().fieldErrors });
      return;
    }

    const { position, salary, startDate, benefits, additionalTerms } = bodyResult.data;
    
    const applicant = await db.query.recruitmentApplicants.findFirst({
      where: eq(recruitmentApplicants.id, Number(applicantId)),
      with: {
        recruitmentJob: {
          columns: { title: true, department: true }
        }
      }
    });

    if (!applicant) { 
      res.status(404).json({ success: false, message: 'Applicant not found' }); 
      return; 
    } 
    
    const jobTitle = applicant.recruitmentJob?.title;

    const doc = new PDFDocument({ margin: 50 }); 
    const chunks: Buffer[] = []; 
    doc.on('data', (chunk: Buffer) => chunks.push(chunk)); 
    doc.on('end', () => { 
      const pdfBuffer = Buffer.concat(chunks); 
      res.setHeader('Content-Type', 'application/pdf'); 
      res.setHeader('Content-Disposition', `attachment; filename=offer_letter_${applicant.firstName}_${applicant.lastName}.pdf`); 
      res.send(pdfBuffer); 
    }); 
    doc.fontSize(20).font('Helvetica-Bold').text('OFFER OF EMPLOYMENT', { align: 'center' }); 
    doc.moveDown(2); 
    doc.fontSize(12).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`); 
    doc.moveDown(); 
    doc.text(`${applicant.firstName} ${applicant.lastName}`); 
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
  } catch (_error) { 

    res.status(500).json({ success: false, message: 'Failed to generate offer letter' }); 
  }
};

export const assignInterviewer = async (req: Request, res: Response): Promise<void> => { 
  try {
    const { applicantId } = req.params as { applicantId: string }; 
    const bodyResult = assignInterviewerSchema.safeParse(req.body);
    
    if (!bodyResult.success) {
      res.status(400).json({ success: false, message: 'Invalid interviewer details' });
      return;
    }

    const { interviewerId } = bodyResult.data;
    await db.update(recruitmentApplicants)
      .set({ interviewerId: interviewerId, stage: 'Screening' })
      .where(eq(recruitmentApplicants.id, Number(applicantId))); 
    res.json({ message: 'Assigned' }); 
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Assignment failed' });
  }
};

export const generateMeetingLink: AuthenticatedHandler = async (req, res) => {
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
      userId: req.user.id,
      title: `Interview: ${jobTitle || 'Position'} - ${applicant.firstName} ${applicant.lastName}`,
      startTime: interviewDate,
      duration: duration,
      description: `Interview for ${jobTitle || 'the position'} with ${applicant.firstName} ${applicant.lastName}`,
      attendeeEmail: applicant.email,
      attendeeName: `${applicant.firstName} ${applicant.lastName}`
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
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to generate meeting link' });
  }
};

export const generateApplicationPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const [applicantData] = await db.select({
        ...getTableColumns(recruitmentApplicants),
        jobTitle: sql<string>`COALESCE(${recruitmentJobs.title}, 'General Application')`,
        jobDepartment: sql<string>`COALESCE(${recruitmentJobs.department}, 'HR')`
    })
    .from(recruitmentApplicants)
    .leftJoin(recruitmentJobs, eq(recruitmentApplicants.jobId, recruitmentJobs.id))
    .where(eq(recruitmentApplicants.id, Number(id)))
    .limit(1);

    if (!applicantData) {
      res.status(404).json({ success: false, message: 'Applicant not found' });
      return;
    }

    const applicant = applicantData;

    // CRITICAL: bufferPages: true is REQUIRED for switchToPage() and bufferedPageRange()
    const doc = new PDFDocument({ 
        margin: 30, 
        size: 'LEGAL',
        bufferPages: true,
        /* eslint-disable @typescript-eslint/naming-convention */
        info: {
            Title: `Application - ${applicant.lastName}, ${applicant.firstName}`,
            Author: 'City of Meycauayan HRMO'
        }
        /* eslint-enable @typescript-eslint/naming-convention */
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
    drawBox(30 + infoWidth / 2, currentY, infoWidth / 2, 40, 'Position applying for', applicant.jobTitle);
    
    // Photo box (spans exactly 90 points height to match the 3 rows on the left)
    const photoX = 30 + infoWidth;
    doc.rect(photoX, currentY, photoSize, 90).lineWidth(0.5).strokeColor(colors.black).stroke();
    doc.fontSize(6).font('Helvetica').fillColor(colors.black).text('2x2 PHOTO', photoX, currentY + 40, { align: 'center', width: photoSize });
    
    if (applicant.photoPath) {
        const photoFullPath = path.join(process.cwd(), 'uploads/resumes', applicant.photoPath);
        if (fs.existsSync(photoFullPath)) {
            try {
                doc.image(photoFullPath, photoX + 1, currentY + 1, { width: photoSize - 2, height: 88 });
            } catch {
                /* ignore image error */
            }
        }
    }

    currentY += 40;
    
    // Continue info boxes next to photo
    drawBox(30, currentY, infoWidth, 25, 'Department / Category', applicant.jobDepartment);
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

    // Education Data (Single Row based on DB)
    drawBox(30, currentY, pageWidth * 0.25, 20, '', applicant.educationalBackground);
    drawBox(30 + pageWidth * 0.25, currentY, pageWidth * 0.35, 20, '', applicant.schoolName);
    drawBox(30 + pageWidth * 0.60, currentY, pageWidth * 0.25, 20, '', applicant.course);
    drawBox(30 + pageWidth * 0.85, currentY, pageWidth * 0.15, 20, '', applicant.yearGraduated);
    currentY += 20;

    // Eligibility Header
    drawBox(30, currentY, pageWidth * 0.3, 14, 'Eligibility / License Name', '', colors.grey);
    drawBox(30 + pageWidth * 0.3, currentY, pageWidth * 0.25, 14, 'Category / Type', '', colors.grey);
    drawBox(30 + pageWidth * 0.55, currentY, pageWidth * 0.1, 14, 'Rating', '', colors.grey);
    drawBox(30 + pageWidth * 0.65, currentY, pageWidth * 0.2, 14, 'Place of Examination', '', colors.grey);
    drawBox(30 + pageWidth * 0.85, currentY, pageWidth * 0.15, 14, 'Date Released', '', colors.grey);
    currentY += 14;

    // Eligibility Data
    const eligDate = applicant.eligibilityDate ? new Date(applicant.eligibilityDate).toLocaleDateString() : '';
    const eligType = applicant.eligibilityType?.replace(/_/g, ' ').toUpperCase();
    drawBox(30, currentY, pageWidth * 0.3, 20, '', applicant.eligibility);
    drawBox(30 + pageWidth * 0.3, currentY, pageWidth * 0.25, 20, '', eligType);
    drawBox(30 + pageWidth * 0.55, currentY, pageWidth * 0.1, 20, '', applicant.eligibilityRating);
    drawBox(30 + pageWidth * 0.65, currentY, pageWidth * 0.2, 20, '', applicant.eligibilityPlace);
    drawBox(30 + pageWidth * 0.85, currentY, pageWidth * 0.15, 20, '', eligDate);
    currentY += 20;

    // License Detail
    drawBox(30, currentY, pageWidth, 20, 'License / ID Number (if applicable)', applicant.licenseNo);
    currentY += 20;

    // --- EXPERIENCE & SKILLS ---
    let remainingSpace = doc.page.height - currentY - 60; // Calculate remaining space on first page
    
    // Check if we need a new page for experience block
    if (remainingSpace < 200) {
        doc.addPage();
        currentY = 30; // reset to top margin
    }

    currentY = drawSectionHeader(currentY, 'PROFESSIONAL EXPERIENCE & SPECIAL SKILLS');
    
    // Totals
    drawBox(30, currentY, pageWidth / 2, 25, 'Total Years of Experience', applicant.totalExperienceYears);
    drawBox(30 + pageWidth / 2, currentY, pageWidth / 2, 25, 'Total Training Hours', 'N/A');
    currentY += 25;

    // Extensive text areas
    drawLongBox(30, currentY, pageWidth, 120, 'Work Experience Log (List roles and responsibilities)', applicant.experience);
    currentY += 120;
    
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
    } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, message: `Failed to generate PDF: ${errorMessage}` });
    }
    };

    export const confirmHiredApplicant: AuthenticatedHandler = async (req, res) => {
    try {
    const { id } = req.params;
    const { startDate, selectedDocs, customNotes } = req.body as { 
        startDate: string; 
        selectedDocs?: string[]; 
        customNotes?: string 
    };

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

    const variables = {
        applicantFirstName: applicant.firstName,
        applicantLastName: applicant.lastName,
        jobTitle: job?.title || 'the position',
        startDate: formattedStart,
        department: job?.department || 'HR'
    };

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
    } catch (emailErr) {
    console.error('[RecruitmentController] Confirm email failed:', emailErr);
    }

    res.status(200).json({ success: true, message: 'Applicant confirmed and notification sent.' });
    } catch (_error) {
    console.error('[RecruitmentController] confirmHiredApplicant failed:', _error);
    res.status(500).json({ success: false, message: 'Failed to confirm applicant' });
    }
    };
export const generatePhotoPDF = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const applicant = await db.query.recruitmentApplicants.findFirst({
            where: eq(recruitmentApplicants.id, Number(id))
        });

        if (!applicant || !applicant.photoPath) {
            res.status(404).json({ success: false, message: '2x2 Photo not found' });
            return;
        }

        const photoFullPath = path.join(process.cwd(), 'uploads/resumes', applicant.photoPath);
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
    } catch (error) {
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
  } catch (error) {
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
    } catch (_error) {

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
    } catch (_error) {

        res.status(500).json({ success: false, message: 'Failed to delete applicant' });
    }
};
