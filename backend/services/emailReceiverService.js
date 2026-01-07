import Imap from 'imap';
import { simpleParser } from 'mailparser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db/connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Email Receiver Service
 * Polls Gmail IMAP for incoming job applications and saves them to the database
 */

// IMAP Configuration
const getImapConfig = () => ({
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: process.env.EMAIL_IMAP_HOST || 'imap.gmail.com',
    port: parseInt(process.env.EMAIL_IMAP_PORT) || 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
});

/**
 * Extract applicant name from email
 * Tries to parse "From" field like "John Doe <john@email.com>"
 */
const extractNameFromEmail = (from) => {
    try {
        if (from && from.value && from.value[0]) {
            const sender = from.value[0];
            if (sender.name) {
                const parts = sender.name.split(' ');
                return {
                    first_name: parts[0] || 'Unknown',
                    last_name: parts.slice(1).join(' ') || 'Applicant'
                };
            }
            // Fallback: use email prefix
            const emailPrefix = sender.address.split('@')[0];
            return { first_name: emailPrefix, last_name: 'Applicant' };
        }
    } catch (err) {
        console.error('Error extracting name:', err);
    }
    return { first_name: 'Unknown', last_name: 'Applicant' };
};

/**
 * Extract sender email address
 */
const extractEmailAddress = (from) => {
    try {
        if (from && from.value && from.value[0]) {
            return from.value[0].address;
        }
    } catch (err) {
        console.error('Error extracting email:', err);
    }
    return 'unknown@email.com';
};

/**
 * Match email subject to a job posting
 * Looks for job title in the subject line
 */
const matchJobFromSubject = async (subject) => {
    try {
        if (!subject) return null;
        
        // Get all open jobs
        const [jobs] = await db.query("SELECT id, title FROM recruitment_jobs WHERE status = 'Open'");
        
        // Try to find a matching job title in the subject
        const subjectLower = subject.toLowerCase();
        
        for (const job of jobs) {
            if (subjectLower.includes(job.title.toLowerCase())) {
                console.log(`Matched job: ${job.title} (ID: ${job.id})`);
                return job.id;
            }
        }
        
        // No match found - return null (will be saved as general application)
        console.log('No job match found for subject:', subject);
        return null;
    } catch (err) {
        console.error('Error matching job:', err);
        return null;
    }
};

/**
 * Save attachment to uploads folder
 */
const saveAttachment = async (attachment) => {
    try {
        const uploadsDir = path.join(__dirname, '../uploads/resumes');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const safeFilename = attachment.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${safeFilename}`;
        const filepath = path.join(uploadsDir, filename);
        
        // Save file
        fs.writeFileSync(filepath, attachment.content);
        console.log('Saved attachment:', filename);
        
        return filename;
    } catch (err) {
        console.error('Error saving attachment:', err);
        return null;
    }
};

/**
 * Check if email has already been processed
 * Uses email subject + sender + date as unique identifier
 */
const isEmailProcessed = async (email, subject, receivedAt) => {
    try {
        const [existing] = await db.query(
            `SELECT id FROM recruitment_applicants 
             WHERE email = ? AND email_subject = ? AND source = 'email'
             LIMIT 1`,
            [email, subject]
        );
        return existing.length > 0;
    } catch (err) {
        console.error('Error checking processed email:', err);
        return false;
    }
};

/**
 * Save application to database
 */
const saveApplication = async (applicantData) => {
    try {
        const { job_id, first_name, last_name, email, resume_path, email_subject } = applicantData;
        
        await db.query(
            `INSERT INTO recruitment_applicants 
             (job_id, first_name, last_name, email, resume_path, source, email_subject, email_received_at)
             VALUES (?, ?, ?, ?, ?, 'email', ?, NOW())`,
            [job_id, first_name, last_name, email, resume_path, email_subject]
        );
        
        console.log(`Saved application from ${email} for job ${job_id || 'General'}`);
        return true;
    } catch (err) {
        console.error('Error saving application:', err);
        return false;
    }
};

/**
 * Process a single email message
 */
const processEmail = async (parsed) => {
    try {
        const subject = parsed.subject || 'No Subject';
        const senderEmail = extractEmailAddress(parsed.from);
        const { first_name, last_name } = extractNameFromEmail(parsed.from);
        
        console.log(`Processing email from: ${senderEmail}, Subject: ${subject}`);
        
        // ========== JUNK EMAIL FILTER ==========
        // List of senders to ignore (bots, no-reply, notifications)
        const ignoredSenders = [
            'mailer-daemon', 'no-reply', 'noreply', 'postmaster',
            'security', 'accounts.google.com', 'facebookmail.com',
            'discordapp.com', 'discord.com', 'linkedin.com', 
            'notifications', 'alert', 'support'
        ];
        
        // Check if sender is a bot/notification
        const senderLower = senderEmail.toLowerCase();
        if (ignoredSenders.some(ignored => senderLower.includes(ignored))) {
            console.log(`Skipping automated email from: ${senderEmail}`);
            return false;
        }
        
        // Check if subject indicates junk/notification
        const junkSubjects = [
            'delivery status', 'failure', 'security alert', 
            'verify your email', 'password', 'login', 'sign in',
            'undelivered', 'returned mail', 'confirmation'
        ];
        const subjectLower = subject.toLowerCase();
        if (junkSubjects.some(junk => subjectLower.includes(junk))) {
            console.log(`Skipping notification email: ${subject}`);
            return false;
        }
        // ========== END JUNK FILTER ==========
        
        // Check if already processed
        if (await isEmailProcessed(senderEmail, subject)) {
            console.log('Email already processed, skipping...');
            return false;
        }
        
        // Match to job
        const job_id = await matchJobFromSubject(subject);
        
        // Save attachments (resume)
        let resume_path = null;
        if (parsed.attachments && parsed.attachments.length > 0) {
            // Find PDF or DOC attachment (resume)
            const resumeAttachment = parsed.attachments.find(att => 
                att.filename && (
                    att.filename.toLowerCase().endsWith('.pdf') ||
                    att.filename.toLowerCase().endsWith('.doc') ||
                    att.filename.toLowerCase().endsWith('.docx')
                )
            );
            
            if (resumeAttachment) {
                resume_path = await saveAttachment(resumeAttachment);
            }
        }
        
        // Skip emails without resume attachment (they're likely not job applications)
        if (!resume_path) {
            console.log(`Skipping email without resume attachment: ${subject}`);
            return false;
        }
        
        // Save to database
        const saved = await saveApplication({
            job_id,
            first_name,
            last_name,
            email: senderEmail,
            resume_path,
            email_subject: subject
        });
        
        return saved;
    } catch (err) {
        console.error('Error processing email:', err);
        return false;
    }
};

/**
 * Fetch and process new emails from IMAP
 */
export const checkForNewApplications = () => {
    return new Promise((resolve, reject) => {
        const config = getImapConfig();
        
        if (!config.user || !config.password) {
            console.log('Email credentials not configured, skipping email check');
            resolve({ success: false, message: 'Email not configured', processed: 0 });
            return;
        }
        
        const imap = new Imap(config);
        let processedCount = 0;
        
        imap.once('ready', () => {
            console.log('IMAP connected, checking for new applications...');
            
            imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    console.error('Error opening inbox:', err);
                    imap.end();
                    reject(err);
                    return;
                }
                
                // Search for unread emails
                imap.search(['UNSEEN'], (err, results) => {
                    if (err) {
                        console.error('Error searching emails:', err);
                        imap.end();
                        reject(err);
                        return;
                    }
                    
                    if (!results || results.length === 0) {
                        console.log('No new emails found');
                        imap.end();
                        resolve({ success: true, message: 'No new emails', processed: 0 });
                        return;
                    }
                    
                    console.log(`Found ${results.length} new email(s)`);
                    
                    const fetch = imap.fetch(results, { 
                        bodies: '', 
                        markSeen: true 
                    });
                    
                    const emailPromises = [];
                    
                    fetch.on('message', (msg) => {
                        let buffer = '';
                        
                        msg.on('body', (stream) => {
                            stream.on('data', (chunk) => {
                                buffer += chunk.toString('utf8');
                            });
                        });
                        
                        msg.once('end', () => {
                            emailPromises.push(
                                simpleParser(buffer)
                                    .then(parsed => processEmail(parsed))
                                    .then(result => {
                                        if (result) processedCount++;
                                    })
                                    .catch(err => console.error('Error parsing email:', err))
                            );
                        });
                    });
                    
                    fetch.once('error', (err) => {
                        console.error('Fetch error:', err);
                    });
                    
                    fetch.once('end', () => {
                        Promise.all(emailPromises)
                            .then(() => {
                                console.log(`Processed ${processedCount} application email(s)`);
                                imap.end();
                                resolve({ 
                                    success: true, 
                                    message: `Processed ${processedCount} application(s)`, 
                                    processed: processedCount 
                                });
                            })
                            .catch(err => {
                                imap.end();
                                reject(err);
                            });
                    });
                });
            });
        });
        
        imap.once('error', (err) => {
            console.error('IMAP error:', err);
            reject(err);
        });
        
        imap.once('end', () => {
            console.log('IMAP connection closed');
        });
        
        imap.connect();
    });
};

/**
 * Manual trigger for checking emails (called from API)
 */
export const manualCheckEmails = async () => {
    try {
        const result = await checkForNewApplications();
        return result;
    } catch (err) {
        console.error('Manual email check failed:', err);
        return { 
            success: false, 
            message: err.message || 'Failed to check emails',
            processed: 0 
        };
    }
};

export default { checkForNewApplications, manualCheckEmails };
