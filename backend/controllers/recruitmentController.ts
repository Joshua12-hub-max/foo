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
    const { duty } = req.query; // 'Standard' | 'Irregular Duties'

    if (!duty || (duty !== 'Standard' && duty !== 'Irregular')) {
      res.status(400).json({ success: false, message: 'Invalid duty type. Must be Standard or Irregular.' });
      return;
    }

    // Mapping duty categories to the specific db employment_type enums
    const standardTypes = ['Permanent', 'Full-time', 'Temporary', 'Probationary'] as const;
    const irregularTypes = ['Job Order', 'Contractual', 'Casual', 'Coterminous', 'Part-time', 'Contract of Service', 'JO', 'COS'] as const;

    // Explicitly type targetTypes based on recruitmentJobs.employment_type enum
    const targetTypes = (duty === 'Standard' ? [...standardTypes] : [...irregularTypes]);

    // Fetch hired applicants whose job corresponds to the target employment types OR the duty type category
    const results = await db.select({
      applicant: recruitmentApplicants,
      job: recruitmentJobs
    })
    .from(recruitmentApplicants)
    .innerJoin(recruitmentJobs, eq(recruitmentApplicants.jobId, recruitmentJobs.id))
    .where(
      and(
        eq(recruitmentApplicants.stage, 'Hired'),
        or(
          inArray(recruitmentJobs.employmentType, targetTypes as ("Full-time" | "Part-time" | "Contractual" | "Job Order" | "Coterminous" | "Temporary" | "Probationary" | "Casual" | "Permanent" | "Contract of Service" | "JO" | "COS")[]),
          eq(recruitmentJobs.dutyType, duty as 'Standard' | 'Irregular')
        )
      )
    )
    .orderBy(desc(recruitmentApplicants.hiredDate));

    // To prevent registering the same applicant twice, we should ideally exclude those whose emails 
    // are already in the authentication table.
    const allAuthEmailsRes = await db.select({ email: authentication.email }).from(authentication);
    const existingEmails = new Set(allAuthEmailsRes.map(a => a.email.toLowerCase()));

    const filteredApplicants = results
      .filter(row => !existingEmails.has(row.applicant.email.toLowerCase()))
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
        requireCivilService, requireGovernmentIds, requireEducationExperience
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
      educationalBackground, schoolName, yearGraduated, course, experience, skills, emergencyContact, emergencyContactNumber
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
    await db.insert(recruitmentApplicants).values({
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
        createdAt: currentManilaDateTime()
    });

    // Trigger Notifications
    await sendApplicationNotifications({ jobId: Number(jobId), firstName: firstName, lastName: lastName, email });

    res.status(201).json({ success: true, message: 'Application submitted successfully' });
  } catch (error) {
    const _err = error instanceof Error ? error : new Error('Unknown database error');
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
      jobTitle: sql`COALESCE(${recruitmentJobs.title}, 'General Application')`,
      jobRequirements: sql`COALESCE(${recruitmentJobs.requirements}, '')`,
      jobDepartment: sql`COALESCE(${recruitmentJobs.department}, 'HR')`,
      jobStatus: sql`COALESCE(${recruitmentJobs.status}, 'Open')`,
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
                organizer: { name: 'Recruitment Team', email: process.env.EMAIL_USER || '' },
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

    const { title, department, jobDescription, requirements, location, status, employmentType, dutyType, applicationEmail, requireCivilService, requireGovernmentIds, requireEducationExperience } = parseResult.data;
  
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

    const doc = new PDFDocument({ 
        margin: 40, 
        size: 'LEGAL',
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
      res.setHeader('Content-Disposition', `inline; filename=application_${applicant.lastName}.pdf`);
      res.send(pdfBuffer);
    });

    // --- COLOR PALETTE ---
    const primaryBlue = '#1e293b';
    const textGray = '#64748b';
    const valueBlack = '#1a1a1a';
    const borderLight = '#e2e8f0';
    const bgLight = '#f8fafc';

    // --- OFFICIAL LOGO & HEADER ---
    const logoPath = path.join(process.cwd(), '../frontend/src/assets/meycauayan-logo.png');
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, 35, { width: 55 });
    }

    doc.fillColor(valueBlack);
    doc.fontSize(8).font('Helvetica').text('Republic of the Philippines', { align: 'center' });
    doc.fontSize(11).font('Helvetica-Bold').text('CITY GOVERNMENT OF MEYCAUAYAN', { align: 'center' });
    doc.fontSize(8).font('Helvetica').text('Province of Bulacan', { align: 'center' });
    doc.fontSize(9).font('Helvetica-Bold').text('CITY HUMAN RESOURCE MANAGEMENT OFFICE', { align: 'center' });
    doc.moveDown(1.5);
    
    // --- 2x2 PHOTO SLOT ---
    const photoSize = 95;
    const photoX = doc.page.width - 40 - photoSize;
    const photoY = 35;

    doc.lineWidth(0.5).strokeColor(borderLight);
    if (applicant.photoPath) {
        const photoFullPath = path.join(process.cwd(), 'uploads/resumes', applicant.photoPath);
        if (fs.existsSync(photoFullPath)) {
            try {
                doc.image(photoFullPath, photoX, photoY, { width: photoSize, height: photoSize });
                doc.rect(photoX, photoY, photoSize, photoSize).stroke();
            } catch (_e) {
                doc.rect(photoX, photoY, photoSize, photoSize).stroke();
                doc.fontSize(7).fillColor(textGray).text('IMAGE ERROR', photoX, photoY + 40, { width: photoSize, align: 'center' });
            }
        } else {
            doc.rect(photoX, photoY, photoSize, photoSize).stroke();
            doc.fontSize(7).fillColor(textGray).text('2x2 PHOTO', photoX, photoY + 40, { width: photoSize, align: 'center' });
        }
    } else {
        doc.rect(photoX, photoY, photoSize, photoSize).stroke();
        doc.fontSize(7).fillColor(textGray).text('2x2 PHOTO', photoX, photoY + 40, { width: photoSize, align: 'center' });
    }

    // --- FORM TITLE ---
    const titleY = 105;
    doc.y = titleY;
    doc.rect(40, doc.y, 350, 24).fill(primaryBlue);
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold').text('Job Application Form', 50, titleY + 6);
    doc.moveDown(1.2);

    // --- HELPERS ---
    const sectionHeader = (title: string, subtitle: string) => {
        doc.moveDown(1.2); // Add solid breathing room before the section starts
        const y = doc.y;
        doc.rect(40, y, doc.page.width - 80, 18).fill(bgLight);
        doc.fillColor(primaryBlue).fontSize(9).font('Helvetica-Bold').text(title, 50, y + 5);
        doc.fillColor(textGray).fontSize(7).font('Helvetica').text(subtitle, 200, y + 6, { align: 'right', width: 340 });
        doc.moveDown(0.4); // Tight space after header
        return y;
    };

    const dataField = (label: string, value: string | null | undefined, x: number, y: number, width: number) => {
        doc.fontSize(8).font('Helvetica-Bold').fillColor(textGray).text(label, x, y);
        const val = value || '---';
        doc.fontSize(12).font('Helvetica').fillColor(valueBlack).text(val, x, y + 11, { width: width - 5, lineBreak: false }); 
        doc.moveTo(x, y + 28).lineTo(x + width - 10, y + 28).lineWidth(0.2).strokeColor(borderLight).stroke(); 
    };

    // --- POSITION INFO ---
    doc.y = 135; // Tighter start
    dataField('Position Applied For', applicant.jobTitle, 40, 135, 250);
    dataField('Date of Application', applicant.createdAt ? new Date(applicant.createdAt).toLocaleDateString() : 'N/A', 300, 135, 150);

    doc.y = 160; // Tighter jump

    // --- 1. PERSONAL DETAILS ---
    sectionHeader('1. Personal Details', 'Core identity profile');
    const pY = doc.y + 5;
    dataField('Last Name', applicant.lastName, 40, pY, 120);
    dataField('First Name', applicant.firstName, 175, pY, 120);
    dataField('Middle Name', applicant.middleName, 310, pY, 120);
    dataField('Suffix', applicant.suffix, 445, pY, 70);

    const pY2 = pY + 42; 
    dataField('Birth Date', applicant.birthDate ? new Date(applicant.birthDate).toLocaleDateString() : '', 40, pY2, 120);
    dataField('Place of Birth', applicant.birthPlace, 175, pY2, 340);

    const pY3 = pY2 + 42; 
    dataField('Gender', applicant.sex, 40, pY3, 90);
    dataField('Civil Status', applicant.civilStatus, 145, pY3, 90);
    dataField('Height (m)', applicant.height, 250, pY3, 80);
    dataField('Weight (kg)', applicant.weight, 345, pY3, 80);
    dataField('Blood Type', applicant.bloodType, 440, pY3, 75);
    doc.y = pY3 + 35; 

    // --- 2. RESIDENCY & CONTACT ---
    const headerY = sectionHeader('2. Residency & Contact', '');
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(applicant.isMeycauayanResident ? '#059669' : '#64748b').text(
        applicant.isMeycauayanResident ? 'Meycauayan Resident' : 'Non-Resident', 350, headerY + 5, { width: 190, align: 'right' }
    );
    const rY = doc.y + 5;
    
    dataField('Residential Address', applicant.address, 40, rY, 400);
    dataField('Res. Zip Code', applicant.zipCode, 450, rY, 70);

    const rY2 = rY + 42; 
    dataField('Permanent Address', applicant.permanentAddress, 40, rY2, 400);
    dataField('Perm. Zip Code', applicant.permanentZipCode, 450, rY2, 70);

    const rY3 = rY2 + 42; 
    dataField('Email Address', applicant.email, 40, rY3, 250);
    dataField('Contact Number', applicant.phoneNumber, 300, rY3, 220);
    doc.y = rY3 + 35; 

    // --- 3. GOVERNMENT RECORDS ---
    sectionHeader('3. Government Records', 'Identification and social records');
    const gY = doc.y + 5;
    dataField('GSIS Number', applicant.gsisNumber, 40, gY, 160);
    dataField('Pag-IBIG Number', applicant.pagibigNumber, 215, gY, 160);
    dataField('PhilHealth Number', applicant.philhealthNumber, 390, gY, 130);

    const gY2 = gY + 42;  
    dataField('UMID Number', applicant.umidNumber, 40, gY2, 160);
    dataField('PhilSys ID', applicant.philsysId, 215, gY2, 160);
    dataField('TIN Number', applicant.tinNumber, 390, gY2, 130);
    doc.y = gY2 + 35; 

    // --- 4. PROFESSIONAL QUALIFICATIONS ---
    sectionHeader('4. Professional Qualifications', 'Education and eligibility');
    const qY = doc.y + 5;
    dataField('Eligibility Name', applicant.eligibility, 40, qY, 200);
    dataField('Category', applicant.eligibilityType?.replace(/_/g, ' '), 250, qY, 150);
    dataField('Rating', applicant.eligibilityRating, 410, qY, 110);

    const qY2 = qY + 45; 
    dataField('Place of Exam', applicant.eligibilityPlace, 40, qY2, 250);
    dataField('License Number', applicant.licenseNo, 305, qY2, 120);
    dataField('Date Released', applicant.eligibilityDate ? new Date(applicant.eligibilityDate).toLocaleDateString() : '', 440, qY2, 80);

    doc.y = qY2 + 40; 
    doc.x = 40; 
    const drawLongText = (label: string, value: string | null | undefined) => {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(textGray).text(label, 40); 
        doc.fontSize(12).font('Helvetica').fillColor(valueBlack).text(value || 'Not provided', { align: 'justify', width: 512 });
        doc.moveDown(1.0);
    };

    drawLongText('Education History', applicant.educationalBackground);
    drawLongText('Work Experience Log', applicant.experience);
    drawLongText('Core Competencies / Skills', applicant.skills);
    
    doc.moveDown(0.1); // Tighter
    dataField('Total Experience (Years)', applicant.totalExperienceYears?.toString(), 40, doc.y, 150);

    // --- FOOTER & SIGNATURE ---
    const footerHeight = 110; // Slightly more space
    const currentY = doc.y;
    
    if (currentY + footerHeight > doc.page.height - 20) {
        doc.addPage();
    } else {
        // Force to bottom
        doc.y = Math.max(currentY + 20, doc.page.height - footerHeight);
    }

    const startFooterY = doc.y;

    doc.fontSize(8).font('Helvetica-Oblique').fillColor(textGray).text(
        'I hereby certify that the information provided in this form is true and correct to the best of my knowledge.',
        40, startFooterY, { align: 'center', width: 512 }
    );
    
    const sigLineY = startFooterY + 45;
    doc.moveTo(100, sigLineY).lineTo(500, sigLineY).lineWidth(0.8).strokeColor(primaryBlue).stroke();
    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryBlue).text('SIGNATURE OVER PRINTED NAME', 40, sigLineY + 8, { align: 'center', width: 512 });

    doc.end();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ success: false, message: `Failed to generate PDF: ${errorMessage}` });
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
