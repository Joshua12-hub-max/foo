import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { 
  recruitmentJobs, 
  recruitmentApplicants, 
  authentication
} from '../db/schema.js';
import { eq, and, sql, desc, or, inArray, isNull } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';
import * as ics from 'ics';
import { getTemplateForStage, replaceVariables } from '../utils/emailHelpers.js';
import { generateGoogleMeetLink } from '../services/meetingService.js';
import type { AuthenticatedRequest, JobStatus, EmploymentType, ApplicantStage, ApplicantSource, ApplicantStatus, InterviewPlatform } from '../types/index.js';
import { 
  createJobSchema, 
  applyJobSchema, 
  updateJobSchema, 
  updateApplicantStageSchema, 
  generateMeetingLinkSchema, 
  saveInterviewNotesSchema 
} from '../schemas/recruitmentSchema.js';

const sendEmailNotification = async (to: string, subject: string, html: string, attachments: object[] = []): Promise<void> => {
  console.log(`Attempting to send email to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Using EMAIL_USER: ${process.env.EMAIL_USER}`);
  try { 
    const transporter = nodemailer.createTransport({ 
      service: 'gmail', 
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } 
    }); 
    const result = await transporter.sendMail({ 
      from: process.env.EMAIL_USER || '"HR Recruitment" <no-reply@company.com>', 
      to, 
      subject, 
      html, 
      attachments 
    }); 
    console.log(`Email sent successfully to ${to}: ${subject}`);
    console.log(`Message ID: ${result.messageId}`);
  } catch (error) { 
    console.error('Failed to send email:', error); 
  }
};

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

    const { title, department, job_description, requirements, salary_range, location, employment_type, application_email, status } = parseResult.data; 
  
    const jobStatus = status || 'Open';
    const postedAt = jobStatus === 'Open' ? new Date().toISOString() : null;
    const attachmentPath = req.file ? `/uploads/general/${req.file.filename}` : null;

    await db.insert(recruitmentJobs).values({
      title,
      department,
      jobDescription: job_description,
      requirements: requirements || null,
      salaryRange: salary_range || null,
      location,
      employmentType: (employment_type || 'Full-time') as EmploymentType,
      applicationEmail: application_email,
      status: jobStatus as JobStatus,
      attachmentPath,
      postedBy: authReq.user.id,
      postedAt: postedAt,
      createdAt: new Date().toISOString()
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
      .orderBy(desc(recruitmentJobs.createdAt));

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
      jobId: Number(job_id),
      firstName: first_name,
      lastName: last_name,
      email,
      phoneNumber: phone_number,
      address,
      education,
      experience,
      skills,
      resumePath: resume_path,
      createdAt: new Date().toISOString()
    });

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
      conditions.push(eq(recruitmentApplicants.jobId, Number(job_id)));
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
      jobId: recruitmentApplicants.jobId,
      firstName: recruitmentApplicants.firstName,
      lastName: recruitmentApplicants.lastName,
      email: recruitmentApplicants.email,
      phoneNumber: recruitmentApplicants.phoneNumber,
      resumePath: recruitmentApplicants.resumePath,
      stage: recruitmentApplicants.stage,
      interviewDate: recruitmentApplicants.interviewDate,
      interviewLink: recruitmentApplicants.interviewLink,
      source: recruitmentApplicants.source,
      createdAt: recruitmentApplicants.createdAt,
      jobTitle: recruitmentJobs.title,
      jobRequirements: recruitmentJobs.requirements,
      jobDepartment: recruitmentJobs.department,
      jobStatus: recruitmentJobs.status,
      interviewerName: sql<string>`CONCAT(${authentication.firstName}, ' ', ${authentication.lastName})`
    })
    .from(recruitmentApplicants)
    .leftJoin(recruitmentJobs, eq(recruitmentApplicants.jobId, recruitmentJobs.id))
    .leftJoin(authentication, eq(recruitmentApplicants.interviewerId, authentication.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(recruitmentApplicants.createdAt));

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
    
    const updateValues: Record<string, unknown> = { stage: stage as ApplicantStage };
    if (interview_date) updateValues.interviewDate = interview_date; // Assumes string ISO
    if (interview_link) updateValues.interviewLink = interview_link;
    if (notes) updateValues.interviewNotes = notes;
    if (stage === 'Hired') updateValues.hiredDate = new Date().toISOString();
    
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
      console.log('Applicant found:', { email: applicant.email, first_name: applicant.firstName });
      
      try {
        const template = await getTemplateForStage(db, stage);
        
        if (template) {
          const variables = {
            applicant_first_name: applicant.firstName,
            applicant_last_name: applicant.lastName,
            job_title: applicant.recruitmentJob?.title || 'the position',
            interview_date: interview_date ? new Date(interview_date).toLocaleString() : 'TBD',
            interview_link: interview_link || '#',
            interview_platform: interview_platform || 'Online',
            interview_notes: notes || ''
          };
          
          const subject = replaceVariables(template.subjectTemplate, variables);
          const body = replaceVariables(template.bodyTemplate, variables);
          
          const attachments: { filename: string; content: string; contentType: string }[] = [];
          
          if ((stage === 'Initial Interview' || stage === 'Final Interview') && interview_date) {
            try {
              const dateObj = new Date(interview_date);
              const event: ics.EventAttributes = {
                start: [dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate(), dateObj.getHours(), dateObj.getMinutes()],
                duration: { minutes: 60 },
                title: `Interview: ${applicant.recruitmentJob?.title} - ${applicant.firstName}`,
                description: `Interview for ${applicant.recruitmentJob?.title}. Platform: ${interview_platform}. Link: ${interview_link}`,
                location: interview_platform ? interview_link : 'Office',
                url: interview_link,
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
                organizer: { name: 'Recruitment Team', email: process.env.EMAIL_USER || '' },
                attendees: [{ name: `${applicant.firstName} ${applicant.lastName}`, email: applicant.email, rsvp: true }]
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

    const { title, department, job_description, requirements, salary_range, location, status, employment_type, application_email } = parseResult.data; 
  
    const updateValues: any = {
      title, 
      department, 
      jobDescription: job_description, 
      requirements: requirements || null, 
      salaryRange: salary_range || null, 
      location, 
      status: status as JobStatus, 
      employmentType: (employment_type || 'Full-time') as EmploymentType, 
      applicationEmail: application_email,
      updatedAt: new Date().toISOString()
    };

    if (req.file) {
      updateValues.attachmentPath = `/uploads/general/${req.file.filename}`;
    }
    
    const currentJob = await db.query.recruitmentJobs.findFirst({
        where: eq(recruitmentJobs.id, Number(id))
    });

    if (currentJob && status === 'Open' && !currentJob.postedAt) {
        updateValues.postedAt = new Date().toISOString();
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
      .orderBy(desc(recruitmentJobs.createdAt));
      
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; 
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<source>\n'; 
    xml += `<publisher>NEBR HR System</publisher>\n<publisherurl>${baseUrl}</publisherurl>\n<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`; 
    jobs.forEach(job => { 
      const createdDate = job.createdAt ? new Date(job.createdAt).toUTCString() : new Date().toUTCString();
      xml += `<job>\n<title><![CDATA[${job.title}]]></title>\n<date><![CDATA[${createdDate}]]></date>\n<referencenumber><![CDATA[${job.id}]]></referencenumber>\n<url><![CDATA[${baseUrl}/careers/job/${job.id}]]></url>\n<company><![CDATA[Local Government of Meycauayan]]></company>\n<city><![CDATA[${job.location}]]></city>\n<state><![CDATA[Bulacan]]></state>\n<country><![CDATA[PH]]></country>\n<description><![CDATA[${job.jobDescription}]]></description>\n<salary><![CDATA[${job.salaryRange}]]></salary>\n<category><![CDATA[${job.department}]]></category>\n</job>\n`; 
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
    const { position, salary, startDate, benefits, additionalTerms } = req.body; 
    
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
  } catch (error) { 
    console.error(error); 
    res.status(500).json({ success: false, message: 'Failed to generate offer letter' }); 
  }
};

export const assignInterviewer = async (req: Request, res: Response): Promise<void> => { 
  const { applicantId } = req.params; 
  const { interviewerId } = req.body; 
  await db.update(recruitmentApplicants)
    .set({ interviewerId, stage: 'Screening' })
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
      .set({ interviewNotes: notes || '' })
      .where(eq(recruitmentApplicants.id, Number(applicantId)));

    res.json({ success: true, message: 'Interview notes saved successfully' });
  } catch (error) {
    console.error('Error saving interview notes:', error);
    res.status(500).json({ success: false, message: 'Failed to save interview notes' });
  }
};
