import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { recruitmentJobs, recruitmentApplicants, authentication } from '../db/schema.js';
import { eq, and, sql, desc, or, inArray, isNull } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import * as ics from 'ics';
import { getTemplateForStage, replaceVariables, sendEmailNotification } from '../utils/emailHelpers.js';
import { generateGoogleMeetLink } from '../services/meetingService.js';
import { currentManilaDateTime } from '../utils/dateUtils.js';
import type { AuthenticatedRequest, JobStatus, EmploymentType, ApplicantStage, ApplicantSource } from '../types/index.js';

import { 
  createJobSchema, 
  applyJobSchema, 
  updateJobSchema, 
  updateApplicantStageSchema, 
  generateMeetingLinkSchema, 
  saveInterviewNotesSchema 
} from '../schemas/recruitmentSchema.js';



export const createJob = async (req: Request, res: Response): Promise<void> => {
  try { 
    const authReq = req as AuthenticatedRequest;
    
    const parseResult = createJobSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors 
      });
      return;
    }

    const { title, department, job_description, requirements, location, employment_type, application_email, status } = parseResult.data; 
  
    const jobStatus = status || 'Open';
    const postedAt = jobStatus === 'Open' ? currentManilaDateTime() : null;
    const attachmentPath = req.file ? `/uploads/general/${req.file.filename}` : null;

    await db.insert(recruitmentJobs).values({
      title,
      department,
      job_description: job_description,
      requirements: requirements || null,
      location,
      employment_type: (employment_type || 'Full-time') as EmploymentType,
      application_email: application_email,
      status: jobStatus as JobStatus,
      attachment_path: attachmentPath,
      posted_by: authReq.user.id,
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
    if (status) {
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
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' }); 
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
    const parseResult = applyJobSchema.safeParse(req.body);

    if (!parseResult.success) {
       res.status(400).json({ 
         success: false, 
         message: 'Validation failed', 
         errors: parseResult.error.flatten().fieldErrors 
       });
       return;
    }

    const { job_id, first_name, last_name, email, phone_number, address, education, experience, skills } = parseResult.data;
    
    const resume_path = req.file ? req.file.filename : null;

    await db.insert(recruitmentApplicants).values({
      job_id: Number(job_id),
      first_name: first_name,
      last_name: last_name,
      email,
      phone_number: phone_number,
      address,
      education,
      experience,
      skills,
      resume_path: resume_path,
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
    if (job_id) {
      conditions.push(eq(recruitmentApplicants.job_id, Number(job_id)));
    }
    
    if (stage) {
      if (stage === 'Pending') {
        conditions.push(or(eq(recruitmentApplicants.stage, 'Applied'), isNull(recruitmentApplicants.stage)));
      } else if (stage === 'Reviewed') {
        conditions.push(eq(recruitmentApplicants.stage, 'Screening'));
      } else if (stage === 'Interview') {
        conditions.push(inArray(recruitmentApplicants.stage, ['Initial Interview', 'Final Interview']));
      } else {
        conditions.push(eq(recruitmentApplicants.stage, stage as ApplicantStage));
      }
    }

    if (source && source !== 'All') {
      conditions.push(eq(recruitmentApplicants.source, (source as string).toLowerCase() as ApplicantSource));
    }

    const applicants = await db.select({
      id: recruitmentApplicants.id,
      job_id: recruitmentApplicants.job_id,
      first_name: recruitmentApplicants.first_name,
      last_name: recruitmentApplicants.last_name,
      email: recruitmentApplicants.email,
      phone_number: recruitmentApplicants.phone_number,
      resume_path: recruitmentApplicants.resume_path,
      stage: recruitmentApplicants.stage,
      interview_date: recruitmentApplicants.interview_date,
      interview_link: recruitmentApplicants.interview_link,
      source: recruitmentApplicants.source,
      created_at: recruitmentApplicants.created_at,
      job_title: sql<string>`COALESCE(${recruitmentJobs.title}, 'General Application')`,
      job_requirements: recruitmentJobs.requirements,
      job_department: sql<string>`COALESCE(${recruitmentJobs.department}, 'HR')`,
      job_status: recruitmentJobs.status,
      interviewer_name: sql<string>`CONCAT(${authentication.firstName}, ' ', ${authentication.lastName})`
    })
    .from(recruitmentApplicants)
    .leftJoin(recruitmentJobs, eq(recruitmentApplicants.job_id, recruitmentJobs.id))
    .leftJoin(authentication, eq(recruitmentApplicants.interviewer_id, authentication.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(recruitmentApplicants.created_at));

    res.json({ success: true, applicants }); 
  } catch (error) { 
    console.error('Error fetching applicants:', error); 
    res.status(500).json({ success: false, message: 'Failed to fetch applicants' }); 
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
    
    const updateValues: Partial<typeof recruitmentApplicants.$inferInsert> = { stage: stage as ApplicantStage };
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

    const { title, department, job_description, requirements, location, status, employment_type, application_email } = parseResult.data; 
  
    const updateValues: Partial<typeof recruitmentJobs.$inferInsert> = {
      title, 
      department, 
      job_description: job_description, 
      requirements: requirements || null, 
      location, 
      status: status ? (status as JobStatus) : undefined, 
      employment_type: employment_type ? (employment_type as EmploymentType) : undefined, 
      application_email: application_email,
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
  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    pending: sql<number>`sum(case when ${recruitmentApplicants.stage} = 'Applied' or ${recruitmentApplicants.stage} is null then 1 else 0 end)`,
    screening: sql<number>`sum(case when ${recruitmentApplicants.stage} = 'Screening' then 1 else 0 end)`,
    interviewing: sql<number>`sum(case when ${recruitmentApplicants.stage} in ('Initial Interview', 'Final Interview') then 1 else 0 end)`,
    hired: sql<number>`sum(case when ${recruitmentApplicants.stage} = 'Hired' then 1 else 0 end)`,
    rejected: sql<number>`sum(case when ${recruitmentApplicants.stage} = 'Rejected' then 1 else 0 end)`
  }).from(recruitmentApplicants);
  
  res.json(stats); 
};

export const generateOfferLetter = async (req: Request, res: Response): Promise<void> => {
  try { 
    const { applicantId } = req.params; 
    const { position, salary, startDate, benefits, additionalTerms } = req.body as { 
      position: string; 
      salary: string; 
      startDate: string; 
      benefits?: string; 
      additionalTerms?: string; 
    }; 
    
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
  const { applicantId } = req.params; 
  const { interviewerId } = req.body as { interviewerId: number }; 
  await db.update(recruitmentApplicants)
    .set({ interviewer_id: interviewerId, stage: 'Screening' })
    .where(eq(recruitmentApplicants.id, Number(applicantId))); 
  res.json({ message: 'Assigned' }); 
};

export const generateMeetingLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
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
