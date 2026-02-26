import { Request, Response } from 'express';
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { db } from '../db/index.js';
import { recruitmentJobs, recruitmentApplicants, authentication } from '../db/schema.js';
import { eq, and, sql, desc, or, inArray, isNull, getTableColumns } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import * as ics from 'ics';
import { getTemplateForStage, replaceVariables, sendEmailNotification } from '../utils/emailHelpers.js';
import { generateGoogleMeetLink } from '../services/meetingService.js';
import { currentManilaDateTime } from '../utils/dateUtils.js';
import { sanitizeInput } from '../utils/spamUtils.js';
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
import { notifyAdmins } from '../controllers/notificationController.js';
import type { AuthenticatedHandler } from '../types/index.js';

function isApplicantStage(val: string): val is ApplicantStage {
  return ['Applied', 'Screening', 'Initial Interview', 'Final Interview', 'Offer', 'Hired', 'Rejected'].includes(val);
}



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

    const { title, department, job_description, requirements, location, employment_type, application_email, status, require_civil_service, require_government_ids, require_education_experience } = parseResult.data;

    const jobStatus = status || 'Open';
    const postedAt = jobStatus === 'Open' ? currentManilaDateTime() : null;
    const attachmentPath = req.file ? `/uploads/general/${req.file.filename}` : null;

    await db.insert(recruitmentJobs).values({
      title,
      department,
      job_description: job_description,
      requirements: requirements || null,
      location,
      employment_type: employment_type,
      application_email: application_email,
      status: jobStatus,
      attachment_path: attachmentPath,
      require_civil_service: require_civil_service ? 1 : 0,
      require_government_ids: require_government_ids ? 1 : 0,
      require_education_experience: require_education_experience ? 1 : 0,
      posted_by: req.user.id,
      posted_at: postedAt,
      created_at: currentManilaDateTime()
    });

    res.status(201).json({ success: true, message: 'Job posted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create job' });
  }
};

export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, public_view } = req.query;

    const conditions = [];
    if (status && typeof status === 'string') {
      conditions.push(eq(recruitmentJobs.status, status as JobStatus));
    }
    if (public_view === 'true') {
      conditions.push(eq(recruitmentJobs.status, 'Open'));
    }

    const jobs = await db.select()
      .from(recruitmentJobs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(recruitmentJobs.created_at));

    res.json({ success: true, jobs });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown database error');
    console.error('getJobs error:', err);
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
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch job' });
  }
};

export const applyJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const req_job_id = req.body.job_id;
    if (!req_job_id) {
        res.status(400).json({ success: false, message: 'job_id is required' });
        return;
    }

    const jobConfig = await db.query.recruitmentJobs.findFirst({ where: eq(recruitmentJobs.id, Number(req_job_id)) });

    if (!jobConfig) {
        res.status(404).json({ success: false, message: 'Job not found' });
        return;
    }

    const isPermanent = jobConfig.employment_type === 'Permanent';
    const requireIds = isPermanent || jobConfig.require_government_ids === 1;
    const requireCsc = isPermanent || jobConfig.require_civil_service === 1;
    const requireEdu = isPermanent || jobConfig.require_education_experience === 1;

    const dynamicSchema = createStrictApplyJobSchema(Boolean(requireIds), Boolean(requireCsc), Boolean(requireEdu));
    const parseResult = dynamicSchema.safeParse(req.body);

    if (!parseResult.success) {
       console.error("Zod Validation Error:", parseResult.error.flatten().fieldErrors);
       res.status(400).json({
         success: false,
         message: 'Validation failed',
         errors: parseResult.error.flatten().fieldErrors
       });
       return;
    }

        const { 
          job_id, first_name, last_name, middle_name, suffix, email, phone_number, 
          address, zip_code, permanent_address, permanent_zip_code, is_meycauayan_resident,
          birth_date, birth_place, sex, civil_status, height, 
          weight, blood_type, gsis_no, pagibig_no, philhealth_no, umid_no, philsys_id, tin_no, 
          eligibility, eligibility_type, eligibility_date, eligibility_rating, eligibility_place, license_no, total_experience_years,
          education, experience, skills, hp_field, h_token
        } = parseResult.data;        // 100% Verification - File Integrity Check
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const resume = files?.['resume']?.[0];
        const eligibilityCert = files?.['eligibility_cert']?.[0];
        const photo = files?.['photo']?.[0];
    
        const verifyFileHeader = (file: Express.Multer.File) => {
            const buffer = fs.readFileSync(file.path, { encoding: null });
            const header = buffer.toString('hex', 0, 4);
            const isPDF = header === '25504446'; // %PDF
            const isDOCX = header === '504b0304'; // PK.. (ZIP)
            const isIMG = header.startsWith('ffd8') || header.startsWith('8950'); // JPEG or PNG
            return isPDF || isDOCX || isIMG;
        };
    
        if (resume && !verifyFileHeader(resume)) {
            res.status(400).json({ success: false, message: 'Invalid resume file integrity. Please upload a real PDF or Word document.' });
            return;
        }
        if (eligibilityCert && !verifyFileHeader(eligibilityCert)) {
            res.status(400).json({ success: false, message: 'Invalid eligibility certificate file integrity.' });
            return;
        }
        if (photo && !verifyFileHeader(photo)) {
            res.status(400).json({ success: false, message: 'Invalid photo file integrity. Please upload a real image.' });
            return;
        }
    
        // CSC Strictness Check
        const isCSC = jobConfig?.employment_type === 'Permanent' || jobConfig?.employment_type === 'Temporary' || jobConfig?.employment_type === 'Probationary';
        
        if (isCSC) {
            if (!eligibility_type || !eligibility_date) {
                res.status(400).json({ success: false, message: 'CSC/Permanent positions require precise Eligibility details (Type and Date).' });
                return;
            }
            if (!eligibilityCert) {
                res.status(400).json({ success: false, message: 'CSC/Permanent positions require a Certificate of Eligibility upload.' });
                return;
            }
        }
    
        // 100% Verification - Honeypot Check (Dual-Layer Trap)
        if (hp_field || parseResult.data.website_url) {
            console.warn(`Spam bot detected (honeypot filled: ${hp_field ? 'Primary' : 'Secondary'}) from IP: ${req.ip}`);
            // Silent Reject: Return success to mislead the bot, but do not save to database.
            res.status(201).json({ success: true, message: 'Application submitted successfully' }); 
            return;
        }
    
        // 100% Verification - Human Token Audit
        if (!h_token || !h_token.startsWith('v-')) {
            res.status(400).json({ success: false, message: 'Security protocol failed. Please use a real browser.' });
            return;
        }
    
        // 100% Verification - Email Audit
        const domain = email.split('@')[1];
        const tempMailDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'sharklasers.com', 'dispostable.com'];
        
        if (tempMailDomains.includes(domain)) {
            res.status(400).json({ success: false, message: 'Disposable email addresses are not allowed.' });
            return;
        }
    
        try {
            const mxRecords = await dns.promises.resolveMx(domain);
            if (!mxRecords || mxRecords.length === 0) {
                res.status(400).json({ success: false, message: 'Invalid email domain. Please use a verified provider.' });
                return;
            }
        } catch (e) {
            res.status(400).json({ success: false, message: 'Could not verify email domain. Please check your email.' });
            return;
        }
    
        const cooldownDate = new Date();
        cooldownDate.setMonth(cooldownDate.getMonth() - 3); // 3 months ago
        const cooldownStr = cooldownDate.toISOString().split('T')[0];
    
        // Check for duplicates within the last 3 months
        // We check by Email OR (Name + Birth Date) OR Government IDs
        const duplicateConditions = [
            eq(recruitmentApplicants.email, email),
            and(
                eq(recruitmentApplicants.first_name, first_name),
                eq(recruitmentApplicants.last_name, last_name),
                eq(recruitmentApplicants.middle_name, middle_name || ''),
                eq(recruitmentApplicants.suffix, suffix || ''),
                eq(recruitmentApplicants.birth_date, birth_date)
            )
        ];
    
        // Add Gov IDs to duplicate check if provided
        if (tin_no) duplicateConditions.push(eq(recruitmentApplicants.tin_no, tin_no));
        if (gsis_no) duplicateConditions.push(eq(recruitmentApplicants.gsis_no, gsis_no));
        if (philsys_id) duplicateConditions.push(eq(recruitmentApplicants.philsys_id, philsys_id));
    
        const existingApplication = await db.query.recruitmentApplicants.findFirst({
            where: and(
                or(...duplicateConditions),
                sql`${recruitmentApplicants.created_at} >= ${cooldownStr}`
            )
        });
    
        if (existingApplication) {
            // Strict Enforcement - Same person, different name, same ID?
            const isSameIDDifferentName = (existingApplication.tin_no === tin_no && tin_no) && 
                                          (existingApplication.first_name !== first_name || existingApplication.last_name !== last_name);
            
            if (isSameIDDifferentName) {
                console.warn(`Potential Identity Fraud: ID ${tin_no} shared between ${first_name} and ${existingApplication.first_name}`);
                res.status(409).json({ success: false, message: 'Identity verification failed. This ID is already registered.' });
                return;
            }
    
            res.status(409).json({ success: false, message: 'You have recently applied. Please wait 3 months before submitting a new application.' });
            return;
        }
    
            const resume_path = resume ? resume.filename : null;
            const eligibility_path = eligibilityCert ? eligibilityCert.filename : null;
            const photo_path = photo ? photo.filename : null;

            // Anti-Spam: Sanitize all user-submitted text fields (XSS prevention)
            const safeFirstName = sanitizeInput(first_name);
            const safeLastName = sanitizeInput(last_name);
            const safeMiddleName = middle_name ? sanitizeInput(middle_name) : middle_name;
            const safeSuffix = suffix ? sanitizeInput(suffix) : suffix;
            const safeAddress = sanitizeInput(address);
            const safePermanentAddress = permanent_address ? sanitizeInput(permanent_address) : permanent_address;
            const safeBirthPlace = sanitizeInput(birth_place);
            const safeEligibility = eligibility ? sanitizeInput(eligibility) : eligibility;
            const safeEligibilityPlace = eligibility_place ? sanitizeInput(eligibility_place) : eligibility_place;
            const safeEducation = education ? sanitizeInput(education) : education;
            const safeExperience = experience ? sanitizeInput(experience) : experience;
            const safeSkills = skills ? sanitizeInput(skills) : skills;

            await db.insert(recruitmentApplicants).values({
              job_id: Number(job_id),
              first_name: safeFirstName,
              last_name: safeLastName,
              middle_name: safeMiddleName,
              suffix: safeSuffix,
              email,
              phone_number,
              address: safeAddress,
              zip_code,
              permanent_address: safePermanentAddress,
              permanent_zip_code,
              is_meycauayan_resident: is_meycauayan_resident ? 1 : 0,
              birth_date,
              birth_place: safeBirthPlace,
              sex,
              civil_status,
              height,
              weight,
              blood_type,
              gsis_no,
              pagibig_no,
              philhealth_no,
              umid_no,
              philsys_id,
              tin_no,
              eligibility: safeEligibility,
              eligibility_type,
              eligibility_date,
              eligibility_rating,
              eligibility_place: safeEligibilityPlace,
              license_no,
              eligibility_path,
              total_experience_years,
              education: safeEducation,
              experience: safeExperience,
              skills: safeSkills,
              resume_path: resume_path,
              photo_path: photo_path,
              created_at: currentManilaDateTime()
            });

    // Send "Applied" email notification
    try {
      const job = await db.query.recruitmentJobs.findFirst({
        where: eq(recruitmentJobs.id, Number(job_id)),
        columns: { title: true }
      });

      const template = await getTemplateForStage(db, 'Applied');
      if (template && job) {
        const variables = {
          applicant_first_name: first_name,
          applicant_last_name: last_name,
          job_title: job.title,
          interview_date: '',
          interview_link: '',
          interview_platform: ''
        };

        const subject = replaceVariables(template.subject_template, variables);
        const body = replaceVariables(template.body_template, variables);
        await sendEmailNotification(email, subject, body);
      }
    } catch (emailError) {
      console.error('Failed to send application email:', emailError);
      // Continue execution, don't fail the request
    }

    // Notify admins about the new application
    try {
      await notifyAdmins({
        title: 'New Job Application',
        message: `${first_name} ${last_name} has applied for a position.`,
        type: 'recruitment',
        referenceId: Number(job_id)
      });
    } catch (notifError) {
      console.error('Failed to send admin notification:', notifError);
    }

    res.status(201).json({ success: true, message: 'Application submitted successfully' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Error in applyJob:', err.message);
    res.status(500).json({ success: false, message: 'Failed to submit application', error: err.message });
  }
};

export const getApplicants = async (req: Request, res: Response): Promise<void> => {
  try { 
    const { job_id, stage, source } = req.query; 
    
    const conditions = [];
    if (job_id && typeof job_id === 'string' && !isNaN(Number(job_id))) {
      conditions.push(eq(recruitmentApplicants.job_id, Number(job_id)));
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
      job_id: recruitmentApplicants.job_id,
      first_name: recruitmentApplicants.first_name,
      last_name: recruitmentApplicants.last_name,
      middle_name: recruitmentApplicants.middle_name,
      suffix: recruitmentApplicants.suffix,
      email: recruitmentApplicants.email,
      phone_number: recruitmentApplicants.phone_number,
      resume_path: recruitmentApplicants.resume_path,
      photo_path: recruitmentApplicants.photo_path,
      stage: recruitmentApplicants.stage,
      status: recruitmentApplicants.status,
      address: recruitmentApplicants.address,
      permanent_address: recruitmentApplicants.permanent_address,
      zip_code: recruitmentApplicants.zip_code,
      permanent_zip_code: recruitmentApplicants.permanent_zip_code,
      is_meycauayan_resident: recruitmentApplicants.is_meycauayan_resident,
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
      eligibility: recruitmentApplicants.eligibility,
      eligibility_type: recruitmentApplicants.eligibility_type,
      eligibility_date: recruitmentApplicants.eligibility_date,
      eligibility_rating: recruitmentApplicants.eligibility_rating,
      eligibility_place: recruitmentApplicants.eligibility_place,
      license_no: recruitmentApplicants.license_no,
      education: recruitmentApplicants.education,
      experience: recruitmentApplicants.experience,
      skills: recruitmentApplicants.skills,
      interview_date: recruitmentApplicants.interview_date,
      interview_link: recruitmentApplicants.interview_link,
      interview_notes: recruitmentApplicants.interview_notes,
      source: recruitmentApplicants.source,
      created_at: recruitmentApplicants.created_at,
      job_title: sql`COALESCE(${recruitmentJobs.title}, 'General Application')`,
      job_requirements: sql`COALESCE(${recruitmentJobs.requirements}, '')`,
      job_department: sql`COALESCE(${recruitmentJobs.department}, 'HR')`,
      job_status: sql`COALESCE(${recruitmentJobs.status}, 'Open')`,
      interviewer_name: sql`CONCAT(COALESCE(${authentication.firstName}, ''), ' ', COALESCE(${authentication.lastName}, ''))`
    })
    .from(recruitmentApplicants)
    .leftJoin(recruitmentJobs, eq(recruitmentApplicants.job_id, recruitmentJobs.id))
    .leftJoin(authentication, eq(recruitmentApplicants.interviewer_id, authentication.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(recruitmentApplicants.created_at));

    res.json({ success: true, applicants }); 
  } catch (error) { 
    console.error('Error fetching applicants:', error); 
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
    
    const { stage, interview_date, interview_link, notes, interview_platform } = parseResult.data;
    
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
    if (interview_date) updateValues.interview_date = interview_date;
    if (interview_link) updateValues.interview_link = interview_link;
    if (notes) updateValues.interview_notes = notes;
    if (stage === 'Hired') updateValues.hired_date = currentManilaDateTime();
    
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
      console.log('Applicant found:', { email: applicant.email, first_name: applicant.first_name });
      
      try {
        const template = await getTemplateForStage(db, stage);
        
        if (template) {
          const variables = {
            applicant_first_name: applicant.first_name,
            applicant_last_name: applicant.last_name,
            job_title: applicant.recruitmentJob?.title || 'the position',
            interview_date: interview_date ? new Date(interview_date).toLocaleString() : 'TBD',
            interview_link: interview_link || '#',
            interview_platform: interview_platform || 'Online',
            interview_notes: notes || ''
          };
          
          const subject = replaceVariables(template.subject_template, variables);
          const body = replaceVariables(template.body_template, variables);
          
          const attachments: { filename: string; content: string; contentType: string }[] = [];
          
          if ((stage === 'Initial Interview' || stage === 'Final Interview') && interview_date) {
            try {
              const dateObj = new Date(interview_date);
              const event: ics.EventAttributes = {
                start: [dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate(), dateObj.getHours(), dateObj.getMinutes()],
                duration: { minutes: 60 },
                title: `Interview: ${applicant.recruitmentJob?.title} - ${applicant.first_name}`,
                description: `Interview for ${applicant.recruitmentJob?.title}. Platform: ${interview_platform}. Link: ${interview_link}`,
                location: interview_platform ? interview_link : 'Office',
                url: interview_link,
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
                organizer: { name: 'Recruitment Team', email: process.env.EMAIL_USER || '' },
                attendees: [{ name: `${applicant.first_name} ${applicant.last_name}`, email: applicant.email, rsvp: true }]
              };
              const { error, value } = ics.createEvent(event);
              if (!error && value) {
                attachments.push({ filename: 'invite.ics', content: value, contentType: 'text/calendar' });
              }
            } catch (icsErr) {
              console.error('ICS Error', icsErr);
            }
          }
          
          await sendEmailNotification(applicant.email, subject, body, attachments);
        }
      } catch (emailErr) {
        console.error('Email error:', emailErr);
      }
    }
    
    res.json({ success: true, message: 'Applicant stage updated' });
  } catch (error) {
    console.error('updateApplicantStage error:', error);
    res.status(500).json({ success: false, message: 'Failed to update stage' });
  }
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => { 
  try { 
    const { id } = req.params; 
    await db.delete(recruitmentJobs).where(eq(recruitmentJobs.id, Number(id))); 
    res.json({ success: true, message: 'Job deleted' }); 
  } catch (error) { 
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

    const { title, department, job_description, requirements, location, status, employment_type, application_email, require_civil_service, require_government_ids, require_education_experience } = parseResult.data;
  
    const updateValues: Partial<typeof recruitmentJobs.$inferInsert> = {
      title, 
      department, 
      job_description: job_description, 
      requirements: requirements || null, 
      location, 
      status, 
      employment_type, 
      application_email: application_email,
      require_civil_service: typeof require_civil_service !== 'undefined' ? (require_civil_service ? 1 : 0) : undefined,
      require_government_ids: typeof require_government_ids !== 'undefined' ? (require_government_ids ? 1 : 0) : undefined,
      require_education_experience: typeof require_education_experience !== 'undefined' ? (require_education_experience ? 1 : 0) : undefined,
      updated_at: currentManilaDateTime()
    };

    if (req.file) {
      updateValues.attachment_path = `/uploads/general/${req.file.filename}`;
    }
    
    const currentJob = await db.query.recruitmentJobs.findFirst({
        where: eq(recruitmentJobs.id, Number(id))
    });

    if (currentJob && status === 'Open' && !currentJob.posted_at) {
        updateValues.posted_at = currentManilaDateTime();
    }

    await db.update(recruitmentJobs)
      .set(updateValues)
      .where(eq(recruitmentJobs.id, Number(id)));
      
    res.json({ success: true, message: 'Job updated successfully' }); 
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ success: false, message: 'Failed to update job' }); 
  }
};

export const generateJobFeed = async (_req: Request, res: Response): Promise<void> => {
  try { 
    const jobs = await db.select()
      .from(recruitmentJobs)
      .where(eq(recruitmentJobs.status, 'Open'))
      .orderBy(desc(recruitmentJobs.created_at));

      
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; 
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<source>\n'; 
    xml += `<publisher>NEBR HR System</publisher>\n<publisherurl>${baseUrl}</publisherurl>\n<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`; 
    jobs.forEach(job => { 
      const createdDate = job.created_at ? new Date(job.created_at).toUTCString() : new Date().toUTCString();
      xml += `<job>\n<title><![CDATA[${job.title}]]></title>\n<date><![CDATA[${createdDate}]]></date>\n<referencenumber><![CDATA[${job.id}]]></referencenumber>\n<url><![CDATA[${baseUrl}/careers/job/${job.id}]]></url>\n<company><![CDATA[Local Government of Meycauayan]]></company>\n<city><![CDATA[${job.location}]]></city>\n<state><![CDATA[Bulacan]]></state>\n<country><![CDATA[PH]]></country>\n<description><![CDATA[${job.job_description}]]></description>\n<category><![CDATA[${job.department}]]></category>\n</job>\n`; 
    }); 
    xml += '</source>'; 
    res.header('Content-Type', 'application/xml'); 
    res.send(xml); 
  } catch (error) { 
    console.error(error); 
    res.status(500).send('Error generating feed'); 
  }
};

export const getPotentialInterviewers = async (_req: Request, res: Response): Promise<void> => { 
  const users = await db.select({
    id: authentication.id,
    first_name: authentication.firstName,
    last_name: authentication.lastName,
    email: authentication.email,
    role: authentication.role,
    job_title: authentication.jobTitle
  })
  .from(authentication)
  .where(inArray(authentication.role, ['admin', 'employee']))
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
    console.error('Error fetching applicant stats:', error);
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
      res.setHeader('Content-Disposition', `attachment; filename=offer_letter_${applicant.first_name}_${applicant.last_name}.pdf`); 
      res.send(pdfBuffer); 
    }); 
    doc.fontSize(20).font('Helvetica-Bold').text('OFFER OF EMPLOYMENT', { align: 'center' }); 
    doc.moveDown(2); 
    doc.fontSize(12).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`); 
    doc.moveDown(); 
    doc.text(`${applicant.first_name} ${applicant.last_name}`); 
    doc.text(applicant.email); 
    doc.moveDown(2); 
    doc.text(`Dear ${applicant.first_name},`); 
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
  } catch (error) { 
    console.error(error); 
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
      .set({ interviewer_id: interviewerId, stage: 'Screening' })
      .where(eq(recruitmentApplicants.id, Number(applicantId))); 
    res.json({ message: 'Assigned' }); 
  } catch (error) {
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
      title: `Interview: ${jobTitle || 'Position'} - ${applicant.first_name} ${applicant.last_name}`,
      startTime: interviewDate,
      duration: duration,
      description: `Interview for ${jobTitle || 'the position'} with ${applicant.first_name} ${applicant.last_name}`,
      attendeeEmail: applicant.email,
      attendeeName: `${applicant.first_name} ${applicant.last_name}`
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
  } catch (error) {
    console.error('Error generating meeting link:', error);
    res.status(500).json({ success: false, message: 'Failed to generate meeting link' });
  }
};

export const generateApplicationPDF = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const [applicantData] = await db.select({
        ...getTableColumns(recruitmentApplicants),
        job_title: sql<string>`COALESCE(${recruitmentJobs.title}, 'General Application')`,
        job_department: sql<string>`COALESCE(${recruitmentJobs.department}, 'HR')`
    })
    .from(recruitmentApplicants)
    .leftJoin(recruitmentJobs, eq(recruitmentApplicants.job_id, recruitmentJobs.id))
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
        info: {
            Title: `Application - ${applicant.last_name}, ${applicant.first_name}`,
            Author: 'City of Meycauayan HRMO'
        }
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=application_${applicant.last_name}.pdf`);
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
    if (applicant.photo_path) {
        const photoFullPath = path.join(process.cwd(), 'uploads/resumes', applicant.photo_path);
        if (fs.existsSync(photoFullPath)) {
            try {
                doc.image(photoFullPath, photoX, photoY, { width: photoSize, height: photoSize });
                doc.rect(photoX, photoY, photoSize, photoSize).stroke();
            } catch (e) {
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
    dataField('Position Applied For', applicant.job_title, 40, 135, 250);
    dataField('Date of Application', applicant.created_at ? new Date(applicant.created_at).toLocaleDateString() : 'N/A', 300, 135, 150);
    doc.y = 160; // Tighter jump

    // --- 1. PERSONAL DETAILS ---
    sectionHeader('1. Personal Details', 'Core identity profile');
    const pY = doc.y + 5;
    dataField('Last Name', applicant.last_name, 40, pY, 120);
    dataField('First Name', applicant.first_name, 175, pY, 120);
    dataField('Middle Name', applicant.middle_name, 310, pY, 120);
    dataField('Suffix', applicant.suffix, 445, pY, 70);

    const pY2 = pY + 42; 
    dataField('Birth Date', applicant.birth_date ? new Date(applicant.birth_date).toLocaleDateString() : '', 40, pY2, 120);
    dataField('Place of Birth', applicant.birth_place, 175, pY2, 340);

    const pY3 = pY2 + 42; 
    dataField('Gender', applicant.sex, 40, pY3, 90);
    dataField('Civil Status', applicant.civil_status, 145, pY3, 90);
    dataField('Height (m)', applicant.height, 250, pY3, 80);
    dataField('Weight (kg)', applicant.weight, 345, pY3, 80);
    dataField('Blood Type', applicant.blood_type, 440, pY3, 75);
    doc.y = pY3 + 35; 

    // --- 2. RESIDENCY & CONTACT ---
    const headerY = sectionHeader('2. Residency & Contact', '');
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(applicant.is_meycauayan_resident ? '#059669' : '#64748b').text(
        applicant.is_meycauayan_resident ? 'Meycauayan Resident' : 'Non-Resident', 350, headerY + 5, { width: 190, align: 'right' }
    );
    const rY = doc.y + 5;
    
    dataField('Residential Address', applicant.address, 40, rY, 400);
    dataField('Res. Zip Code', applicant.zip_code, 450, rY, 70);

    const rY2 = rY + 42; 
    dataField('Permanent Address', applicant.permanent_address, 40, rY2, 400);
    dataField('Perm. Zip Code', applicant.permanent_zip_code, 450, rY2, 70);

    const rY3 = rY2 + 42; 
    dataField('Email Address', applicant.email, 40, rY3, 250);
    dataField('Contact Number', applicant.phone_number, 300, rY3, 220);
    doc.y = rY3 + 35; 

    // --- 3. GOVERNMENT RECORDS ---
    sectionHeader('3. Government Records', 'Identification and social records');
    const gY = doc.y + 5;
    dataField('GSIS Number', applicant.gsis_no, 40, gY, 160);
    dataField('Pag-IBIG Number', applicant.pagibig_no, 215, gY, 160);
    dataField('PhilHealth Number', applicant.philhealth_no, 390, gY, 130);

    const gY2 = gY + 42; 
    dataField('UMID Number', applicant.umid_no, 40, gY2, 160);
    dataField('PhilSys ID', applicant.philsys_id, 215, gY2, 160);
    dataField('TIN Number', applicant.tin_no, 390, gY2, 130);
    doc.y = gY2 + 35; 

    // --- 4. PROFESSIONAL QUALIFICATIONS ---
    sectionHeader('4. Professional Qualifications', 'Education and eligibility');
    const qY = doc.y + 5;
    dataField('Eligibility Name', applicant.eligibility, 40, qY, 200);
    dataField('Category', applicant.eligibility_type?.replace(/_/g, ' '), 250, qY, 150);
    dataField('Rating', applicant.eligibility_rating, 410, qY, 110);

    const qY2 = qY + 45; 
    dataField('Place of Exam', applicant.eligibility_place, 40, qY2, 250);
    dataField('License Number', applicant.license_no, 305, qY2, 120);
    dataField('Date Released', applicant.eligibility_date ? new Date(applicant.eligibility_date).toLocaleDateString() : '', 440, qY2, 80);

    doc.y = qY2 + 40; 
    doc.x = 40; 
    const drawLongText = (label: string, value: string | null | undefined) => {
        doc.fontSize(9).font('Helvetica-Bold').fillColor(textGray).text(label, 40); 
        doc.fontSize(12).font('Helvetica').fillColor(valueBlack).text(value || 'Not provided', { align: 'justify', width: 512 });
        doc.moveDown(1.0);
    };

    drawLongText('Education History', applicant.education);
    drawLongText('Work Experience Log', applicant.experience);
    drawLongText('Core Competencies / Skills', applicant.skills);
    
    doc.moveDown(0.1); // Tighter
    dataField('Total Experience (Years)', applicant.total_experience_years?.toString(), 40, doc.y, 150);

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
    console.error('PDF Generation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF' });
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
      .set({ interview_notes: notes || '' })
      .where(eq(recruitmentApplicants.id, Number(applicantId)));

    res.json({ success: true, message: 'Interview notes saved successfully' });
  } catch (error) {
    console.error('Error saving interview notes:', error);
    res.status(500).json({ success: false, message: 'Failed to save interview notes' });
  }
};
