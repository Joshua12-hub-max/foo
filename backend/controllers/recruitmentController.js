import db from '../db/connection.js';
import nodemailer from 'nodemailer';

// Helper to send email
const sendEmailNotification = async (to, subject, html) => {
  try {
    // Basic transporter - Replace with actual SMTP config from .env
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your SMTP host
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER || '"HR Recruitment" <no-reply@company.com>',
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Failed to send email:', error);
    // Don't throw, just log. We don't want to break the app flow if email fails.
  }
};

// 1. Create Job
export const createJob = async (req, res) => {
  try {
    const { title, department, job_description, requirements, salary_range, location, employment_type } = req.body;
    const posted_by = req.user.id;

    await db.query(
      `INSERT INTO recruitment_jobs (title, department, job_description, requirements, salary_range, location, employment_type, posted_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, department, job_description, requirements, salary_range, location, employment_type || 'Full-time', posted_by]
    );

    res.status(201).json({ success: true, message: "Job posted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create job" });
  }
};

// 2. Get Jobs
export const getJobs = async (req, res) => {
  try {
    const { status, public_view } = req.query;
    let query = "SELECT * FROM recruitment_jobs WHERE 1=1";
    const params = [];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }
    
    // Public view only sees Open jobs
    if (public_view === 'true') {
        query += " AND status = 'Open'";
    }

    query += " ORDER BY created_at DESC";

    const [jobs] = await db.query(query, params);
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch jobs" });
  }
};

// 2.5 Get Single Job (Public)
export const getJob = async (req, res) => {
  try {
    const { id } = req.params;
    const [jobs] = await db.query("SELECT * FROM recruitment_jobs WHERE id = ?", [id]);
    
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    res.json({ success: true, job: jobs[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch job" });
  }
};

// 3. Apply for Job
export const applyJob = async (req, res) => {
  try {
    const { job_id, first_name, last_name, email, phone_number } = req.body;
    const resume_path = req.file ? req.file.filename : null;

    if (!resume_path) {
      return res.status(400).json({ success: false, message: "Resume is required" });
    }

    await db.query(
      `INSERT INTO recruitment_applicants (job_id, first_name, last_name, email, phone_number, resume_path)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [job_id, first_name, last_name, email, phone_number, resume_path]
    );

    // Notify HR (mock logic - you'd likely fetch HR email)
    // await sendEmailNotification('hr@company.com', 'New Applicant', `New applicant for Job ID ${job_id}`);

    res.status(201).json({ success: true, message: "Application submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to submit application" });
  }
};

// 4. Get Applicants (Kanban Board Data)
export const getApplicants = async (req, res) => {
  try {
    const { job_id } = req.query;
    let query = `
      SELECT a.*, j.title as job_title 
      FROM recruitment_applicants a
      JOIN recruitment_jobs j ON a.job_id = j.id
    `;
    const params = [];

    if (job_id) {
      query += " WHERE a.job_id = ?";
      params.push(job_id);
    }

    const [applicants] = await db.query(query, params);
    res.json({ success: true, applicants });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch applicants" });
  }
};

// 5. Update Applicant Stage (Drag & Drop)
export const updateApplicantStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, interview_date, interview_link, notes } = req.body;

    // Update Query
    let query = "UPDATE recruitment_applicants SET stage = ?";
    const params = [stage];

    if (interview_date) {
        query += ", interview_date = ?";
        params.push(interview_date);
    }
    if (interview_link) {
        query += ", interview_link = ?";
        params.push(interview_link);
    }
    if (notes) {
        query += ", interview_notes = ?";
        params.push(notes);
    }
    
    // Set hired date if hired
    if (stage === 'Hired') {
        query += ", hired_date = NOW()";
    }

    query += " WHERE id = ?";
    params.push(id);

    await db.query(query, params);

    // Fetch applicant details for notification
    const [apps] = await db.query("SELECT * FROM recruitment_applicants WHERE id = ?", [id]);
    const applicant = apps[0];

    // NOTIFICATIONS
    if (applicant) {
        let subject = '';
        let body = '';

        if (stage === 'Initial Interview' || stage === 'Final Interview') {
            subject = 'Interview Invitation';
            body = `
                <h1>Interview Invitation</h1>
                <p>Dear ${applicant.first_name},</p>
                <p>You have been shortlisted for an ${stage}.</p>
                <p><strong>Date:</strong> ${new Date(interview_date).toLocaleString()}</p>
                <p><strong>Link:</strong> <a href="${interview_link}">${interview_link}</a></p>
                <p>Please ensure you are available.</p>
            `;
        } else if (stage === 'Hired') {
            subject = 'Congratulations! You are Hired';
            body = `<p>Dear ${applicant.first_name}, welcome to the team!</p>`;
        } else if (stage === 'Rejected') {
            subject = 'Application Update';
            body = `<p>Dear ${applicant.first_name}, thank you for your interest. Unfortunately, we will not proceed at this time.</p>`;
        }

        if (subject) {
            await sendEmailNotification(applicant.email, subject, body);
            // Here you would also add calls to sendTelegram(applicant.phone, message) etc.
        }
    }

    res.json({ success: true, message: "Applicant stage updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update stage" });
  }
};

// 7. Generate XML Feed (For Indeed/Google Jobs)
export const generateJobFeed = async (req, res) => {
  try {
    const [jobs] = await db.query("SELECT * FROM recruitment_jobs WHERE status = 'Open' ORDER BY created_at DESC");
    
    // Base URL for your frontend
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; // Update with production URL

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<source>\n';
    xml += '<publisher>NEBR HR System</publisher>\n';
    xml += `<publisherurl>${baseUrl}</publisherurl>\n`;
    xml += `<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
    
    jobs.forEach(job => {
      xml += '<job>\n';
      xml += `<title><![CDATA[${job.title}]]></title>\n`;
      xml += `<date><![CDATA[${new Date(job.created_at).toUTCString()}]]></date>\n`;
      xml += `<referencenumber><![CDATA[${job.id}]]></referencenumber>\n`;
      xml += `<url><![CDATA[${baseUrl}/careers/job/${job.id}]]></url>\n`;
      xml += `<company><![CDATA[Local Government of Meycauayan]]></company>\n`; // Replace with dynamic company name if needed
      xml += `<city><![CDATA[${job.location}]]></city>\n`;
      xml += `<state><![CDATA[Bulacan]]></state>\n`;
      xml += `<country><![CDATA[PH]]></country>\n`;
      xml += `<description><![CDATA[${job.job_description}\n\nRequirements:\n${job.requirements}]]></description>\n`;
      xml += `<salary><![CDATA[${job.salary_range}]]></salary>\n`;
      xml += `<category><![CDATA[${job.department}]]></category>\n`;
      xml += '</job>\n';
    });
    
    xml += '</source>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating feed');
  }
};

// 6. Delete Job
export const deleteJob = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query("DELETE FROM recruitment_jobs WHERE id = ?", [id]);
        res.json({ success: true, message: "Job deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete job" });
    }
};

// 7. Update Job
export const updateJob = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, department, job_description, requirements, salary_range, location, status, employment_type } = req.body;

        await db.query(
            `UPDATE recruitment_jobs 
             SET title = ?, department = ?, job_description = ?, requirements = ?, salary_range = ?, location = ?, status = ?, employment_type = ?
             WHERE id = ?`,
            [title, department, job_description, requirements, salary_range, location, status, employment_type || 'Full-time', id]
        );

        res.json({ success: true, message: "Job updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to update job" });
    }
};

// 8. Mark Job as Posted (when shared to external platforms)
export const markAsPosted = async (req, res) => {
    try {
        const { id } = req.params;
        const { platform } = req.body; // linkedin, indeed, jobstreet, facebook

        await db.query(
            `UPDATE recruitment_jobs SET posted_at = NOW() WHERE id = ? AND posted_at IS NULL`,
            [id]
        );

        res.json({ success: true, message: `Job marked as posted to ${platform}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to mark job as posted" });
    }
};
