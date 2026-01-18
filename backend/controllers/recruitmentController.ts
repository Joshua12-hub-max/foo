import { Request, Response } from 'express';
import db from '../db/connection.js';
import nodemailer from 'nodemailer';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import * as ics from 'ics';
import { getTemplateForStage, replaceVariables } from '../utils/emailHelpers.js';
import { generateGoogleMeetLink } from '../services/meetingService.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';

interface JobRow extends RowDataPacket { id: number; title: string; department: string; job_description: string; requirements?: string; salary_range?: string; location: string; employment_type: string; application_email?: string; status?: string; posted_by?: number; created_at?: Date; posted_at?: Date; }
interface ApplicantRow extends RowDataPacket { id: number; job_id: number; first_name: string; last_name: string; email: string; phone_number?: string; resume_path?: string; stage?: string; interview_date?: Date; interview_link?: string; job_title?: string; interviewer_id?: number; }
interface UserRow extends RowDataPacket { id: number; first_name: string; last_name: string; email: string; role: string; job_title?: string; }
interface StatsRow extends RowDataPacket { total: number; pending: number; screening: number; interviewing: number; hired: number; rejected: number; }

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
  try { const authReq = req as AuthenticatedRequest; const { title, department, job_description, requirements, salary_range, location, employment_type, application_email, status } = req.body; if (!title || !department || !job_description || !application_email) { res.status(400).json({ success: false, message: 'Missing required fields' }); return; } 
  
  const jobStatus = status || 'Open';
  const postedAt = jobStatus === 'Open' ? new Date() : null;

  await db.query(`INSERT INTO recruitment_jobs (title, department, job_description, requirements, salary_range, location, employment_type, application_email, status, posted_by, posted_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`, [title, department, job_description, requirements, salary_range, location, employment_type || 'Full-time', application_email, jobStatus, authReq.user.id, postedAt]); res.status(201).json({ success: true, message: 'Job posted successfully' }); } catch (error) { console.error(error); res.status(500).json({ success: false, message: 'Failed to create job' }); }
};

export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try { const { status, public_view } = req.query; let query = 'SELECT * FROM recruitment_jobs WHERE 1=1'; const params: string[] = []; if (status) { query += ' AND status = ?'; params.push(status as string); } if (public_view === 'true') { query += " AND status = 'Open'"; } query += ' ORDER BY created_at DESC'; const [jobs] = await db.query<JobRow[]>(query, params); res.json({ success: true, jobs }); } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch jobs' }); }
};

export const getJob = async (req: Request, res: Response): Promise<void> => {
  try { const { id } = req.params; const [jobs] = await db.query<JobRow[]>('SELECT * FROM recruitment_jobs WHERE id = ?', [id]); if (jobs.length === 0) { res.status(404).json({ success: false, message: 'Job not found' }); return; } res.json({ success: true, job: jobs[0] }); } catch (error) { res.status(500).json({ success: false, message: 'Failed to fetch job' }); }
};

export const applyJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { job_id, first_name, last_name, email, phone_number, address, education, experience, skills } = req.body;
    const resume_path = req.file ? req.file.filename : null;

    await db.query(`INSERT INTO recruitment_applicants (job_id, first_name, last_name, email, phone_number, address, education, experience, skills, resume_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`, 
    [job_id, first_name, last_name, email, phone_number, address, education, experience, skills, resume_path]);

    res.status(201).json({ success: true, message: 'Application submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to submit application' });
  }
};

export const getApplicants = async (req: Request, res: Response): Promise<void> => {
  try { const { job_id, stage, source } = req.query; let query = `SELECT a.*, j.title as job_title, j.requirements as job_requirements, j.department as job_department, j.status as job_status, CONCAT(auth.first_name, ' ', auth.last_name) as interviewer_name FROM recruitment_applicants a LEFT JOIN recruitment_jobs j ON a.job_id = j.id LEFT JOIN authentication auth ON a.interviewer_id = auth.id WHERE 1=1`; const params: string[] = []; if (job_id) { query += ' AND a.job_id = ?'; params.push(job_id as string); } if (stage) { const s = stage as string; if (s === 'Pending') query += " AND (a.stage = 'Applied' OR a.stage IS NULL)"; else if (s === 'Reviewed') query += " AND a.stage = 'Screening'"; else if (s === 'Interview') query += " AND a.stage IN ('Initial Interview', 'Final Interview')"; else if (s === 'Hired') query += " AND a.stage = 'Hired'"; else if (s === 'Rejected') query += " AND a.stage = 'Rejected'"; } if (source && source !== 'All') { query += ' AND a.source = ?'; params.push((source as string).toLowerCase()); } query += ' ORDER BY a.created_at DESC'; const [applicants] = await db.query<ApplicantRow[]>(query, params); res.json({ success: true, applicants }); } catch (error) { console.error('Error fetching applicants:', error); res.status(500).json({ success: false, message: 'Failed to fetch applicants' }); }
};

export const updateApplicantStage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stage, interview_date, interview_link, notes, interview_platform } = req.body;
    
    console.log('updateApplicantStage called');
    console.log('Params:', { id, stage, interview_date, interview_link, interview_platform });
    
    let query = 'UPDATE recruitment_applicants SET stage = ?';
    const params: (string | null)[] = [stage];
    if (interview_date) { query += ', interview_date = ?'; params.push(interview_date); }
    if (interview_link) { query += ', interview_link = ?'; params.push(interview_link); }
    if (notes) { query += ', interview_notes = ?'; params.push(notes); }
    if (stage === 'Hired') { query += ', hired_date = NOW()'; }
    query += ' WHERE id = ?';
    params.push(id);
    
    await db.query(query, params);
    console.log('Database updated successfully');
    
    const [apps] = await db.query<ApplicantRow[]>('SELECT * FROM recruitment_applicants WHERE id = ?', [id]);
    const applicant = apps[0];
    
    if (applicant) {
      console.log('Applicant found:', { email: applicant.email, first_name: applicant.first_name });
      const matchedStage = stage === 'Reviewed' ? 'Screening' : stage;
      console.log('Looking for template for stage:', matchedStage);
      
      try {
        const template = await getTemplateForStage(db, matchedStage);
        console.log('Template found:', template ? 'YES' : 'NO');
        
        if (template) {
          const variables = {
            applicant_first_name: applicant.first_name,
            applicant_last_name: applicant.last_name,
            job_title: applicant.job_title || 'the position',
            interview_date: interview_date ? new Date(interview_date).toLocaleString() : 'TBD',
            interview_link: interview_link || '#',
            interview_platform: interview_platform || 'Online',
            interview_notes: notes || ''
          };
          
          const subject = replaceVariables(template.subject_template, variables);
          const body = replaceVariables(template.body_template, variables);
          console.log('Email subject:', subject);
          
          const attachments: { filename: string; content: string; contentType: string }[] = [];
          
          if ((matchedStage === 'Initial Interview' || matchedStage === 'Final Interview') && interview_date) {
            try {
              const dateObj = new Date(interview_date);
              const event: ics.EventAttributes = {
                start: [dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate(), dateObj.getHours(), dateObj.getMinutes()],
                duration: { minutes: 60 },
                title: `Interview: ${applicant.job_title} - ${applicant.first_name}`,
                description: `Interview for ${applicant.job_title}. Platform: ${interview_platform}. Link: ${interview_link}`,
                location: interview_platform === 'Online' ? interview_link : 'Office',
                url: interview_link,
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
                organizer: { name: 'Recruitment Team', email: process.env.EMAIL_USER || '' },
                attendees: [{ name: `${applicant.first_name} ${applicant.last_name}`, email: applicant.email, rsvp: true }]
              };
              const { error, value } = ics.createEvent(event);
              if (!error && value) {
                attachments.push({ filename: 'invite.ics', content: value, contentType: 'text/calendar' });
                console.log('ICS attachment created');
              }
            } catch (icsErr) {
              console.error('ICS Error', icsErr);
            }
          }
          
          console.log('Calling sendEmailNotification...');
          await sendEmailNotification(applicant.email, subject, body, attachments);
        } else {
          console.log('No template found for stage:', matchedStage);
        }
      } catch (emailErr) {
        console.error('Email error:', emailErr);
      }
    } else {
      console.log('Applicant not found for id:', id);
    }
    
    res.json({ success: true, message: 'Applicant stage updated' });
  } catch (error) {
    console.error('updateApplicantStage error:', error);
    res.status(500).json({ success: false, message: 'Failed to update stage' });
  }
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => { try { const { id } = req.params; await db.query('DELETE FROM recruitment_jobs WHERE id = ?', [id]); res.json({ success: true, message: 'Job deleted' }); } catch (error) { res.status(500).json({ success: false, message: 'Failed to delete job' }); } };

export const updateJob = async (req: Request, res: Response): Promise<void> => {
  try { const { id } = req.params; const { title, department, job_description, requirements, salary_range, location, status, employment_type, application_email } = req.body; 
  
  let setClause = `title = ?, department = ?, job_description = ?, requirements = ?, salary_range = ?, location = ?, status = ?, employment_type = ?, application_email = ?, updated_at = NOW()`;
  const params: any[] = [title, department, job_description, requirements, salary_range, location, status, employment_type || 'Full-time', application_email];
  
  if (status === 'Open') {
    setClause += `, posted_at = COALESCE(posted_at, NOW())`;
  }

  await db.query(`UPDATE recruitment_jobs SET ${setClause} WHERE id = ?`, [...params, id]); 
  res.json({ success: true, message: 'Job updated successfully' }); } catch (error) { console.error(error); res.status(500).json({ success: false, message: 'Failed to update job' }); }
};

export const generateJobFeed = async (req: Request, res: Response): Promise<void> => {
  try { const [jobs] = await db.query<JobRow[]>("SELECT * FROM recruitment_jobs WHERE status = 'Open' ORDER BY created_at DESC"); const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<source>\n'; xml += `<publisher>NEBR HR System</publisher>\n<publisherurl>${baseUrl}</publisherurl>\n<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`; jobs.forEach(job => { xml += `<job>\n<title><![CDATA[${job.title}]]></title>\n<date><![CDATA[${new Date(job.created_at || Date.now()).toUTCString()}]]></date>\n<referencenumber><![CDATA[${job.id}]]></referencenumber>\n<url><![CDATA[${baseUrl}/careers/job/${job.id}]]></url>\n<company><![CDATA[Local Government of Meycauayan]]></company>\n<city><![CDATA[${job.location}]]></city>\n<state><![CDATA[Bulacan]]></state>\n<country><![CDATA[PH]]></country>\n<description><![CDATA[${job.job_description}]]></description>\n<salary><![CDATA[${job.salary_range}]]></salary>\n<category><![CDATA[${job.department}]]></category>\n</job>\n`; }); xml += '</source>'; res.header('Content-Type', 'application/xml'); res.send(xml); } catch (error) { console.error(error); res.status(500).send('Error generating feed'); }
};



export const getPotentialInterviewers = async (req: Request, res: Response): Promise<void> => { const [users] = await db.query<UserRow[]>("SELECT id, first_name, last_name, email, role, job_title FROM authentication WHERE role IN ('admin', 'employee') ORDER BY first_name ASC"); res.json(users); };

export const getApplicantStats = async (req: Request, res: Response): Promise<void> => { const [rows] = await db.query<StatsRow[]>(`SELECT COUNT(*) as total, SUM(CASE WHEN stage = 'Applied' OR stage IS NULL THEN 1 ELSE 0 END) as pending, SUM(CASE WHEN stage = 'Screening' THEN 1 ELSE 0 END) as screening, SUM(CASE WHEN stage IN ('Initial Interview', 'Final Interview') THEN 1 ELSE 0 END) as interviewing, SUM(CASE WHEN stage = 'Hired' THEN 1 ELSE 0 END) as hired, SUM(CASE WHEN stage = 'Rejected' THEN 1 ELSE 0 END) as rejected FROM recruitment_applicants`); res.json(rows[0]); };

export const generateOfferLetter = async (req: Request, res: Response): Promise<void> => {
  try { const { applicantId } = req.params; const { position, salary, startDate, benefits, additionalTerms } = req.body; const [applicants] = await db.query<ApplicantRow[]>(`SELECT a.*, j.title as job_title, j.department FROM recruitment_applicants a LEFT JOIN recruitment_jobs j ON a.job_id = j.id WHERE a.id = ?`, [applicantId]); if (applicants.length === 0) { res.status(404).json({ success: false, message: 'Applicant not found' }); return; } const applicant = applicants[0]; const doc = new PDFDocument({ margin: 50 }); const chunks: Buffer[] = []; doc.on('data', (chunk: Buffer) => chunks.push(chunk)); doc.on('end', () => { const pdfBuffer = Buffer.concat(chunks); res.setHeader('Content-Type', 'application/pdf'); res.setHeader('Content-Disposition', `attachment; filename=offer_letter_${applicant.first_name}_${applicant.last_name}.pdf`); res.send(pdfBuffer); }); doc.fontSize(20).font('Helvetica-Bold').text('OFFER OF EMPLOYMENT', { align: 'center' }); doc.moveDown(2); doc.fontSize(12).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`); doc.moveDown(); doc.text(`${applicant.first_name} ${applicant.last_name}`); doc.text(applicant.email); doc.moveDown(2); doc.text(`Dear ${applicant.first_name},`); doc.moveDown(); doc.text(`We are pleased to offer you the position of ${position || applicant.job_title}. We believe your skills and experience will be a valuable addition to our team.`); doc.moveDown(); doc.font('Helvetica-Bold').text('Terms of Employment:'); doc.font('Helvetica').moveDown(0.5); doc.text(`Position: ${position || applicant.job_title}`); doc.text(`Start Date: ${startDate ? new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'To be determined'}`); doc.text(`Salary: ${salary || 'As discussed'}`); doc.moveDown(); if (benefits) { doc.font('Helvetica-Bold').text('Benefits:'); doc.font('Helvetica').text(benefits); doc.moveDown(); } if (additionalTerms) { doc.font('Helvetica-Bold').text('Additional Terms:'); doc.font('Helvetica').text(additionalTerms); doc.moveDown(); } doc.text('We look forward to welcoming you to our team.'); doc.moveDown(2); doc.text('Sincerely,'); doc.moveDown(2); doc.text('_______________________________'); doc.text('Human Resources Department'); doc.moveDown(3); doc.text('Acceptance:'); doc.moveDown(); doc.text('I accept the offer of employment as described above.'); doc.moveDown(2); doc.text('_______________________________          _______________'); doc.text('Signature                                                    Date'); doc.end(); } catch (error) { console.error('Error generating offer letter:', error); res.status(500).json({ success: false, message: 'Failed to generate offer letter', error: (error as Error).message }); }
};

export const assignInterviewer = async (req: Request, res: Response): Promise<void> => { const { applicantId } = req.params; const { interviewerId } = req.body; await db.query(`UPDATE recruitment_applicants SET interviewer_id = ?, stage = 'Screening' WHERE id = ?`, [interviewerId, applicantId]); res.json({ message: 'Assigned' }); };

export const generateMeetingLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    // Validate request body with Zod
    const { generateMeetingLinkSchema } = await import('../schemas/recruitmentSchema.js');
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
    const [applicants] = await db.query<ApplicantRow[]>(
      `SELECT a.*, j.title as job_title FROM recruitment_applicants a 
       LEFT JOIN recruitment_jobs j ON a.job_id = j.id WHERE a.id = ?`,
      [applicantId]
    );

    if (applicants.length === 0) {
      res.status(404).json({ success: false, message: 'Applicant not found' });
      return;
    }

    const applicant = applicants[0];
    const interviewDate = new Date(date);

    const result = await generateGoogleMeetLink({
      userId: authReq.user.id,
      title: `Interview: ${applicant.job_title || 'Position'} - ${applicant.first_name} ${applicant.last_name}`,
      startTime: interviewDate,
      duration: duration,
      description: `Interview for ${applicant.job_title || 'the position'} with ${applicant.first_name} ${applicant.last_name}`,
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
    const { saveInterviewNotesSchema } = await import('../schemas/recruitmentSchema.js');
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
    await db.query(
      `UPDATE recruitment_applicants SET interview_notes = ? WHERE id = ?`,
      [notes || '', applicantId]
    );

    res.json({ success: true, message: 'Interview notes saved successfully' });
  } catch (error) {
    console.error('Error saving interview notes:', error);
    res.status(500).json({ success: false, message: 'Failed to save interview notes' });
  }
};
