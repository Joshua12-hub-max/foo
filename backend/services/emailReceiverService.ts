import Imap from 'imap';
import { simpleParser, ParsedMail, AddressObject, Attachment } from 'mailparser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../db/index.js';
import { recruitmentJobs, recruitmentApplicants } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EmailCheckResult {
  success: boolean;
  message: string;
  processed: number;
}

interface ApplicantData {
  job_id: number | null;
  first_name: string;
  last_name: string;
  email: string;
  resume_path: string | null;
  email_subject: string;
}

/**
 * Parsed name structure
 */
interface ParsedName {
  first_name: string;
  last_name: string;
}

/**
 * IMAP configuration type
 */
interface ImapConfig {
  user: string | undefined;
  password: string | undefined;
  host: string;
  port: number;
  tls: boolean;
  tlsOptions: { rejectUnauthorized: boolean };
}

// Ignored senders (bots, no-reply, notifications)
const IGNORED_SENDERS = [
  'mailer-daemon', 'no-reply', 'noreply', 'postmaster',
  'security', 'accounts.google.com', 'facebookmail.com',
  'discordapp.com', 'discord.com', 'linkedin.com',
  'notifications', 'alert', 'support'
];

// Junk subject patterns
const JUNK_SUBJECTS = [
  'delivery status', 'failure', 'security alert',
  'verify your email', 'password', 'login', 'sign in',
  'undelivered', 'returned mail', 'confirmation'
];

/**
 * Get IMAP configuration from environment
 */
const getImapConfig = (): ImapConfig => ({
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASS,
  host: process.env.EMAIL_IMAP_HOST || 'imap.gmail.com',
  port: parseInt(process.env.EMAIL_IMAP_PORT || '993', 10),
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
});

/**
 * Extract applicant name from email "From" field
 */
const extractNameFromEmail = (from: AddressObject | undefined): ParsedName => {
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
      const emailPrefix = (sender.address || 'unknown').split('@')[0];
      return { first_name: emailPrefix, last_name: 'Applicant' };
    }
  } catch (err) {
    console.error('Error extracting name:', err);
  }
  return { first_name: 'Unknown', last_name: 'Applicant' };
};

/**
 * Extract sender email address from "From" field
 */
const extractEmailAddress = (from: AddressObject | undefined): string => {
  try {
    if (from && from.value && from.value[0]) {
      return from.value[0].address || 'unknown@email.com';
    }
  } catch (err) {
    console.error('Error extracting email:', err);
  }
  return 'unknown@email.com';
};

/**
 * Match email subject to a job posting
 */
const matchJobFromSubject = async (subject: string | undefined): Promise<number | null> => {
  try {
    if (!subject) return null;

    // Get all open jobs
    const jobs = await db.select({
      id: recruitmentJobs.id,
      title: recruitmentJobs.title
    })
    .from(recruitmentJobs)
    .where(eq(recruitmentJobs.status, 'Open'));

    // Try to find a matching job title in the subject
    const subjectLower = subject.toLowerCase();

    for (const job of jobs) {
      if (subjectLower.includes(job.title.toLowerCase())) {
        console.log(`Matched job: ${job.title} (ID: ${job.id})`);
        return job.id;
      }
    }

    // No match found
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
const saveAttachment = async (attachment: Attachment): Promise<string | null> => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads/resumes');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = attachment.filename || 'resume';
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${timestamp}_${safeFilename}`;
    const filepath = path.join(uploadsDir, uniqueFilename);

    // Save file
    fs.writeFileSync(filepath, attachment.content);
    console.log('Saved attachment:', uniqueFilename);

    return uniqueFilename;
  } catch (err) {
    console.error('Error saving attachment:', err);
    return null;
  }
};

/**
 * Check if email has already been processed
 */
const isEmailProcessed = async (email: string, subject: string): Promise<boolean> => {
  try {
    const existing = await db.query.recruitmentApplicants.findFirst({
      where: and(
        eq(recruitmentApplicants.email, email),
        eq(recruitmentApplicants.emailSubject, subject),
        eq(recruitmentApplicants.source, 'email')
      )
    });
    return !!existing;
  } catch (err) {
    console.error('Error checking processed email:', err);
    return false;
  }
};

/**
 * Save application to database
 */
const saveApplication = async (applicantData: ApplicantData): Promise<boolean> => {
  try {
    const { job_id, first_name, last_name, email, resume_path, email_subject } = applicantData;

    await db.insert(recruitmentApplicants).values({
      jobId: job_id,
      firstName: first_name,
      lastName: last_name,
      email,
      resumePath: resume_path,
      source: 'email',
      emailSubject: email_subject,
      emailReceivedAt: new Date().toISOString()
    });

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
const processEmail = async (parsed: ParsedMail): Promise<boolean> => {
  try {
    const subject = parsed.subject || 'No Subject';
    const senderEmail = extractEmailAddress(parsed.from);
    const { first_name, last_name } = extractNameFromEmail(parsed.from);

    console.log(`Processing email from: ${senderEmail}, Subject: ${subject}`);

    // Junk email filter - check sender
    const senderLower = senderEmail.toLowerCase();
    if (IGNORED_SENDERS.some((ignored) => senderLower.includes(ignored))) {
      console.log(`Skipping automated email from: ${senderEmail}`);
      return false;
    }

    // Check if subject indicates junk/notification
    const subjectLower = subject.toLowerCase();
    if (JUNK_SUBJECTS.some((junk) => subjectLower.includes(junk))) {
      console.log(`Skipping notification email: ${subject}`);
      return false;
    }

    // Check if already processed
    if (await isEmailProcessed(senderEmail, subject)) {
      console.log('Email already processed, skipping...');
      return false;
    }

    // Match to job
    const job_id = await matchJobFromSubject(subject);

    // Save attachments (resume)
    let resume_path: string | null = null;
    if (parsed.attachments && parsed.attachments.length > 0) {
      // Find PDF or DOC attachment (resume)
      const resumeAttachment = parsed.attachments.find(
        (att) =>
          att.filename &&
          (att.filename.toLowerCase().endsWith('.pdf') ||
            att.filename.toLowerCase().endsWith('.doc') ||
            att.filename.toLowerCase().endsWith('.docx'))
      );

      if (resumeAttachment) {
        resume_path = await saveAttachment(resumeAttachment);
      }
    }

    // Skip emails without resume attachment
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
export const checkForNewApplications = (): Promise<EmailCheckResult> => {
  return new Promise((resolve, reject) => {
    const config = getImapConfig();

    if (!config.user || !config.password) {
      console.log('Email credentials not configured, skipping email check');
      resolve({ success: false, message: 'Email not configured', processed: 0 });
      return;
    }

    const imap = new Imap(config as Imap.Config);
    let processedCount = 0;

    imap.once('ready', () => {
      console.log('IMAP connected, checking for new applications...');

      imap.openBox('INBOX', false, (err) => {
        if (err) {
          console.error('Error opening inbox:', err);
          imap.end();
          reject(err);
          return;
        }

        // Search for unread emails
        imap.search(['UNSEEN'], (searchErr, results) => {
          if (searchErr) {
            console.error('Error searching emails:', searchErr);
            imap.end();
            reject(searchErr);
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

          const emailPromises: Promise<void>[] = [];

          fetch.on('message', (msg) => {
            let buffer = '';

            msg.on('body', (stream) => {
              stream.on('data', (chunk: Buffer) => {
                buffer += chunk.toString('utf8');
              });
            });

            msg.once('end', () => {
              emailPromises.push(
                simpleParser(buffer)
                  .then((parsed) => processEmail(parsed))
                  .then((result) => {
                    if (result) processedCount++;
                  })
                  .catch((parseErr) => console.error('Error parsing email:', parseErr))
              );
            });
          });

          fetch.once('error', (fetchErr) => {
            console.error('Fetch error:', fetchErr);
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
              .catch((promiseErr) => {
                imap.end();
                reject(promiseErr);
              });
          });
        });
      });
    });

    imap.once('error', (imapErr) => {
      console.error('IMAP error:', imapErr);
      reject(imapErr);
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
export const manualCheckEmails = async (): Promise<EmailCheckResult> => {
  try {
    const result = await checkForNewApplications();
    return result;
  } catch (err) {
    const error = err as Error;
    console.error('Manual email check failed:', error);
    return {
      success: false,
      message: error.message || 'Failed to check emails',
      processed: 0
    };
  }
};

export default { checkForNewApplications, manualCheckEmails };