import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Shared Email Transporter
 * 100% Secure — Uses environment variables for credentials.
 * Reused across the application to prevent connection overhead.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  pool: true, // Use a connection pool for efficiency
  maxConnections: 5,
  maxMessages: 100
});

/**
 * Sanitize email content to prevent injection
 */
const sanitizeEmailHeader = (header: string): string => {
  return header.replace(/[\r\n]/g, ''); // Prevent header injection
};

/**
 * Send an email securely
 * @param to - Recipient email (Sanitized)
 * @param subject - Subject line (Sanitized)
 * @param html - HTML body content
 * @param attachments - Optional attachments array
 */
export const sendEmail = async (
  to: string, 
  subject: string, 
  html: string, 
  attachments: unknown[] = []
): Promise<void> => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email configuration missing in .env');
    }

    const safeTo = sanitizeEmailHeader(to);
    const safeSubject = sanitizeEmailHeader(subject);

    await transporter.sendMail({
      from: `"NEBR System" <${process.env.EMAIL_USER}>`,
      to: safeTo,
      subject: safeSubject,
      html,
      attachments: attachments as nodemailer.SendMailOptions['attachments']
    });
  } catch (error: unknown) {
    // Log only the error message, NOT sensitive transporter details
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, msg);
    throw error;
  }
};

/**
 * Mask email for display in UI/Logs
 */
export const maskEmail = (email: string): string => {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  const maskedUser = user.length > 2 
    ? user.substring(0, 2) + '*'.repeat(user.length - 2) 
    : user + '*';
  return `${maskedUser}@${domain}`;
};

export default transporter;
