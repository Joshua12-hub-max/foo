import db from '../db/connection.js';
import nodemailer from 'nodemailer';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit';
import * as ics from 'ics';
import { getTemplateForStage, replaceVariables } from '../utils/emailHelpers.js';
import { socialMediaService } from '../services/socialMediaService.js';

// Helper to send email
const sendEmailNotification = async (to, subject, html, attachments = []) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER || '"HR Recruitment" <no-reply@company.com>',
      to,
      subject,
      html,
      attachments
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

// 1. Create Job
export const createJob = async (req, res) => {
  try {
    const { title, department, job_description, requirements, salary_range, location, employment_type, application_email } = req.body;
    const posted_by = req.user.id;

    if (!title || !department || !job_description || !application_email) {
       return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    await db.query(
      `INSERT INTO recruitment_jobs (title, department, job_description, requirements, salary_range, location, employment_type, application_email, posted_by, created_at)` +
       `
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [title, department, job_description, requirements, salary_range, location, employment_type || 'Full-time', application_email, posted_by]
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
      `INSERT INTO recruitment_applicants (job_id, first_name, last_name, email, phone_number, resume_path, created_at)` +
       `
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [job_id, first_name, last_name, email, phone_number, resume_path]
    );

    res.status(201).json({ success: true, message: "Application submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to submit application" });
  }
};

// 4. Get Applicants (Kanban Board Data)
export const getApplicants = async (req, res) => {
  try {
    const { job_id, stage, source } = req.query;
    let query = `
      SELECT 
        a.*, 
        j.title as job_title,
        j.requirements as job_requirements,
        j.department as job_department,
        j.status as job_status,
        CONCAT(auth.first_name, ' ', auth.last_name) as interviewer_name
      FROM recruitment_applicants a
      LEFT JOIN recruitment_jobs j ON a.job_id = j.id
      LEFT JOIN authentication auth ON a.interviewer_id = auth.id
      WHERE 1=1
    `;
    const params = [];

    if (job_id) {
      query += " AND a.job_id = ?";
      params.push(job_id);
    }

    if (stage) {
      if (stage === 'Pending') {
        query += " AND (a.stage = 'Applied' OR a.stage IS NULL)";
      } else if (stage === 'Reviewed') {
        query += " AND a.stage = 'Screening'";
      } else if (stage === 'Interview') {
        query += " AND a.stage IN ('Initial Interview', 'Final Interview')";
      } else if (stage === 'Hired') {
        query += " AND a.stage = 'Hired'";
      } else if (stage === 'Rejected') {
        query += " AND a.stage = 'Rejected'";
      }
    }

    if (source && source !== 'All') {
      query += " AND a.source = ?";
      params.push(source.toLowerCase());
    }
    
    query += " ORDER BY a.created_at DESC";

    const [applicants] = await db.query(query, params);
    res.json({ success: true, applicants });
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ success: false, message: "Failed to fetch applicants" });
  }
};

// 5. Update Applicant Stage
export const updateApplicantStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, interview_date, interview_link, notes, interview_platform } = req.body;

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
    
    if (stage === 'Hired') {
        query += ", hired_date = NOW()";
        // Auto-onboarding logic omitted for brevity, assumed to be same or handled by separate service
    }

    query += " WHERE id = ?";
    params.push(id);

    await db.query(query, params);

    // Fetch applicant details for notification
    const [apps] = await db.query("SELECT * FROM recruitment_applicants WHERE id = ?", [id]);
    const applicant = apps[0];

    // Notification Logic
    if (applicant) {
        let matchedStage = stage === 'Reviewed' ? 'Screening' : stage;
        const template = await getTemplateForStage(db, matchedStage);
        
        if (template) {
            const variables = {
                applicant_first_name: applicant.first_name,
                applicant_last_name: applicant.last_name,
                job_title: applicant.job_title || 'the position',
                interview_date: interview_date ? new Date(interview_date).toLocaleString() : 'TBD',
                interview_link: interview_link || '#',
                interview_platform: interview_platform || 'Online',
                interview_notes: notes || '',
            };

            const subject = replaceVariables(template.subject_template, variables);
            const body = replaceVariables(template.body_template, variables);
            let attachments = [];

            if ((matchedStage === 'Initial Interview' || matchedStage === 'Final Interview') && interview_date) {
                const dateObj = new Date(interview_date);
                const event = {
                    start: [dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate(), dateObj.getHours(), dateObj.getMinutes()],
                    duration: { minutes: 60 },
                    title: `Interview: ${applicant.job_title} - ${applicant.first_name}`,
                    description: `Interview for ${applicant.job_title}. Platform: ${interview_platform}. Link: ${interview_link}`,
                    location: interview_platform === 'Online' ? interview_link : 'Office',
                    url: interview_link,
                    status: 'CONFIRMED',
                    busyStatus: 'BUSY',
                    organizer: { name: 'Recruitment Team', email: process.env.EMAIL_USER },
                    attendees: [{ name: `${applicant.first_name} ${applicant.last_name}`, email: applicant.email, rsvp: true }]
                };

                const { error, value } = ics.createEvent(event);
                if (!error) {
                    attachments.push({ filename: 'invite.ics', content: value, contentType: 'text/calendar' });
                }
            }
            await sendEmailNotification(applicant.email, subject, body, attachments);
        }
    }

    res.json({ success: true, message: "Applicant stage updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update stage" });
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
        const { title, department, job_description, requirements, salary_range, location, status, employment_type, application_email } = req.body;

        await db.query(
            `UPDATE recruitment_jobs 
             SET title = ?, department = ?, job_description = ?, requirements = ?, salary_range = ?, location = ?, status = ?, employment_type = ?, application_email = ?, updated_at = NOW()` +
             `
             WHERE id = ?`,
            [title, department, job_description, requirements, salary_range, location, status, employment_type || 'Full-time', application_email, id]
        );

        res.json({ success: true, message: "Job updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to update job" });
    }
};

// 8. Generate XML Feed
export const generateJobFeed = async (req, res) => {
    try {
      const [jobs] = await db.query("SELECT * FROM recruitment_jobs WHERE status = 'Open' ORDER BY created_at DESC");
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<source>\n';
      xml += `<publisher>NEBR HR System</publisher>\n<publisherurl>${baseUrl}</publisherurl>\n<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
      
      jobs.forEach(job => {
        xml += `<job>\n<title><![CDATA[${job.title}]]></title>\n<date><![CDATA[${new Date(job.created_at).toUTCString()}]]></date>\n<referencenumber><![CDATA[${job.id}]]></referencenumber>\n<url><![CDATA[${baseUrl}/careers/job/${job.id}]]></url>\n<company><![CDATA[Local Government of Meycauayan]]></company>\n<city><![CDATA[${job.location}]]></city>\n<state><![CDATA[Bulacan]]></state>\n<country><![CDATA[PH]]></country>\n<description><![CDATA[${job.job_description}]]></description>\n<salary><![CDATA[${job.salary_range}]]></salary>\n<category><![CDATA[${job.department}]]></category>\n</job>\n`;
      });
      xml += '</source>';
  
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error(error);
      res.status(500).send('Error generating feed');
    }
  };

// 9. Post to Facebook
export const postToFacebook = async (req, res) => {
    try {
        const { id } = req.params;
        const [jobs] = await db.query("SELECT * FROM recruitment_jobs WHERE id = ?", [id]);
        
        if (jobs.length === 0) return res.status(404).json({ success: false, message: "Job not found" });

        const pageId = process.env.FB_PAGE_ID;
        const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;

        if (!pageId || !accessToken || pageId.includes('your_facebook')) {
            return res.status(400).json({ success: false, message: "Facebook Integration not configured" });
        }

        const result = await socialMediaService.postToFacebook(jobs[0], pageId, accessToken);
        
        await db.query(`UPDATE recruitment_jobs SET posted_at = NOW(), fb_post_id = ? WHERE id = ?`, [result.postId, id]);

        res.json({ success: true, message: "Published to Facebook!", postId: result.postId });
    } catch (error) {
        console.error('FB Error:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Failed to post to Facebook", error: error.message });
    }
};

// 10. Post to Telegram
export const postToTelegram = async (req, res) => {
    try {
        const { id } = req.params;
        const [jobs] = await db.query("SELECT * FROM recruitment_jobs WHERE id = ?", [id]);
        
        if (jobs.length === 0) return res.status(404).json({ success: false, message: "Job not found" });

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const channelId = process.env.TELEGRAM_CHANNEL_ID;

        if (!botToken || !channelId) {
            return res.status(400).json({ success: false, message: "Telegram Integration not configured" });
        }

        const result = await socialMediaService.postToTelegram(jobs[0], botToken, channelId);

        await db.query(`UPDATE recruitment_jobs SET posted_at = NOW() WHERE id = ?`, [id]);

        res.json({ success: true, message: "Published to Telegram!" });
    } catch (error) {
        console.error('Telegram Error:', error.message);
        res.status(500).json({ success: false, message: "Failed to post to Telegram" });
    }
};

// 11. Post to LinkedIn
export const postToLinkedIn = async (req, res) => {
    try {
        const { id } = req.params;
        const [jobs] = await db.query("SELECT * FROM recruitment_jobs WHERE id = ?", [id]);
        
        if (jobs.length === 0) return res.status(404).json({ success: false, message: "Job not found" });

        const clientId = process.env.LINKEDIN_CLIENT_ID;
        if (!clientId) return res.status(400).json({ success: false, message: "LinkedIn not configured" });

        const accessToken = await socialMediaService.getLinkedInToken();
        
        if (!accessToken) {
            const redirectUri = encodeURIComponent(`${process.env.API_URL || 'http://localhost:5000'}/api/recruitment/linkedin/callback`);
            const scope = encodeURIComponent('w_member_social');
            const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=job_${id}`;
            
            return res.status(400).json({
                success: false, 
                message: "LinkedIn authentication required", 
                authUrl, 
                requiresAuth: true 
            });
        }

        const result = await socialMediaService.postToLinkedIn(jobs[0], accessToken);

        await db.query(`UPDATE recruitment_jobs SET posted_at = NOW(), linkedin_post_id = ? WHERE id = ?`, [result.postId, id]);

        res.json({ success: true, message: "Published to LinkedIn!", postId: result.postId });
    } catch (error) {
        console.error('LinkedIn Error:', error.response?.data || error.message);
        
        // Handle Token Expiry or Invalid Token
        if (error.response?.status === 401) {
             // Generate Auth URL again
             const redirectUri = encodeURIComponent(`${process.env.API_URL || 'http://localhost:5000'}/api/recruitment/linkedin/callback`);
             const scope = encodeURIComponent('w_member_social');
             const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=job_${id}`;
             
             // Optional: Clear invalid token from DB (to prevent immediate retry loop without auth)
             // await socialMediaService.clearLinkedInToken(); 

             return res.status(401).json({ 
                 success: false, 
                 message: "LinkedIn token expired. Please login again.", 
                 authUrl,
                 requiresAuth: true
             });
        }
        res.status(500).json({ success: false, message: "Failed to post to LinkedIn", error: error.message });
    }
};

// 12. LinkedIn Auth Logic (Get URL & Callback)
export const getLinkedInAuthUrl = async (req, res) => {
    try {
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const redirectUri = encodeURIComponent(`${process.env.API_URL || 'http://localhost:5000'}/api/recruitment/linkedin/callback`);
        const scope = encodeURIComponent('w_member_social');
        const state = req.query.state || 'default';
        const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
        res.json({ success: true, authUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to generate URL" });
    }
};

export const linkedInCallback = async (req, res) => {
    try {
        const { code, state, error } = req.query;
        // Basic error handling for user cancel or other errors
        if (error) {
             return res.send(`
                <script>
                    if (window.opener) {
                        window.opener.postMessage({ type: 'LINKEDIN_AUTH_ERROR', error: "${error}" }, '*');
                        window.close();
                    }
                </script>
                <h3>Authorization Cancelled</h3>
             `);
        }

        const clientId = process.env.LINKEDIN_CLIENT_ID;
        const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
        const redirectUri = `${process.env.API_URL || 'http://localhost:5000'}/api/recruitment/linkedin/callback`;

        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', redirectUri);
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);

        const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, expires_in } = tokenResponse.data;
        await socialMediaService.storeLinkedInToken(access_token, expires_in);



        // Send postMessage to opener window and close popup
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>LinkedIn Auth Success</title></head>
            <body>
                <h3>Authorization successful! You can close this window.</h3>
                <script>
                    if (window.opener) {
                        window.opener.postMessage({ 
                            type: 'LINKEDIN_AUTH_SUCCESS', 
                            state: '${state}' 
                        }, '*');
                        window.close();
                    } else {
                        // Fallback redirect if not in popup
                        window.location.href = '${process.env.CLIENT_URL || 'http://localhost:5173'}/admin-dashboard/recruitment/jobs?linkedin_auth_success=true&state=${state}';
                    }
                </script>
            </body>
            </html>
        `);

    } catch (error) {
        console.error("LinkedIn Callback Error:", error.message);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        res.redirect(`${clientUrl}/admin-dashboard/recruitment/jobs?linkedin_auth_error=CallbackFailed`);
    }
};

// 13. Test Facebook
export const testFacebookConnection = async (req, res) => {
    try {
        const pageId = process.env.FB_PAGE_ID;
        const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;
        
        if (!pageId || !accessToken) return res.status(400).json({ success: false, message: "Credentials missing" });

        const response = await axios.get(`https://graph.facebook.com/v18.0/${pageId}`, {
            params: { fields: 'name,link', access_token: accessToken }
        });

        res.json({ success: true, message: "Connected!", pageName: response.data.name });
    } catch (error) {
        res.status(500).json({ success: false, message: "Connection failed" });
    }
};

// 14. Mark as Posted (Manual)
export const markAsPostedManual = async (req, res) => {
    const { id } = req.params;
    const { platform } = req.body;
    await db.query(`UPDATE recruitment_jobs SET posted_at = NOW() WHERE id = ?`, [id]);
    res.json({ success: true });
};

// 15. Misc Helpers (Interviewers, Stats)
export const getPotentialInterviewers = async (req, res) => {
    const [users] = await db.query("SELECT id, first_name, last_name, email, role, job_title FROM authentication WHERE role IN ('admin', 'employee') ORDER BY first_name ASC");
    res.json(users);
};

export const getApplicantStats = async (req, res) => {
    const [rows] = await db.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN stage = 'Applied' OR stage IS NULL THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN stage = 'Screening' THEN 1 ELSE 0 END) as screening,
            SUM(CASE WHEN stage IN ('Initial Interview', 'Final Interview') THEN 1 ELSE 0 END) as interviewing,
            SUM(CASE WHEN stage = 'Hired' THEN 1 ELSE 0 END) as hired,
            SUM(CASE WHEN stage = 'Rejected' THEN 1 ELSE 0 END) as rejected
        FROM recruitment_applicants
    `);
    res.json(rows[0]);
};

// 16. Generate Offer Letter
export const generateOfferLetter = async (req, res) => {
    try {
        const { applicantId } = req.params;
        const { position, salary, startDate, benefits, additionalTerms } = req.body;

        // Fetch applicant details
        const [applicants] = await db.query(`
            SELECT a.*, j.title as job_title, j.department 
            FROM recruitment_applicants a
            LEFT JOIN recruitment_jobs j ON a.job_id = j.id
            WHERE a.id = ?
        `, [applicantId]);

        if (applicants.length === 0) {
            return res.status(404).json({ success: false, message: 'Applicant not found' });
        }

        const applicant = applicants[0];

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=offer_letter_${applicant.first_name}_${applicant.last_name}.pdf`);
            res.send(pdfBuffer);
        });

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text('OFFER OF EMPLOYMENT', { align: 'center' });
        doc.moveDown(2);

        // Date
        doc.fontSize(12).font('Helvetica').text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
        doc.moveDown();

        // Applicant Address
        doc.text(`${applicant.first_name} ${applicant.last_name}`);
        doc.text(applicant.email);
        doc.moveDown(2);

        // Salutation
        doc.text(`Dear ${applicant.first_name},`);
        doc.moveDown();

        // Body
        doc.text(`We are pleased to offer you the position of ${position || applicant.job_title} in the ${applicant.department || 'our organization'}. We believe your skills and experience will be a valuable addition to our team.`);
        doc.moveDown();

        doc.font('Helvetica-Bold').text('Terms of Employment:');
        doc.font('Helvetica');
        doc.moveDown(0.5);

        doc.text(`Position: ${position || applicant.job_title}`);
        doc.text(`Department: ${applicant.department || 'To be assigned'}`);
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

        doc.text('This offer is contingent upon the successful completion of a background check and verification of your credentials.');
        doc.moveDown();

        doc.text('Please sign and return a copy of this letter by the date indicated to confirm your acceptance of this offer.');
        doc.moveDown(2);

        doc.text('We look forward to welcoming you to our team.');
        doc.moveDown(2);

        doc.text('Sincerely,');
        doc.moveDown(2);
        doc.text('_______________________________');
        doc.text('Human Resources Department');
        doc.moveDown(3);

        doc.text('Acceptance:');
        doc.moveDown();
        doc.text('I accept the offer of employment as described above.');
        doc.moveDown(2);
        doc.text('_______________________________          _______________');
        doc.text('Signature                                                    Date');

        doc.end();

    } catch (error) {
        console.error('Error generating offer letter:', error);
        res.status(500).json({ success: false, message: 'Failed to generate offer letter', error: error.message });
    }
};

export const assignInterviewer = async (req, res) => {
    const { applicantId } = req.params;
    const { interviewerId } = req.body;
    await db.query(`UPDATE recruitment_applicants SET interviewer_id = ?, stage = 'Screening' WHERE id = ?`, [interviewerId, applicantId]);
    res.json({ message: "Assigned" });
};