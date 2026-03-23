import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

/**
 * Shared Email Transporter
 * 100% Secure — Uses environment variables for credentials.
 * Reused across the application to prevent connection overhead.
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL/TLS
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
  attachments: nodemailer.SendMailOptions['attachments'] = []
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

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send OTP email using the secure shared transporter
 */
export const sendOTPEmail = async (
  email: string,
  firstName: string,
  otp: string,
  subjectLine: string = 'Verification Code',
  bodyPrefix: string = 'Please use the code below to verify your account:'
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">CHRMO Mey Portal Verification</h2>
      <p>Hello <strong>${firstName}</strong>,</p>
      <p>${bodyPrefix}</p>
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; margin: 25px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">${otp}</span>
      </div>
      <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      <div style="border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #999; text-align: center;">
        &copy; ${new Date().getFullYear()} Local Government of Meycauayan - CHRMO Mey Portal
      </div>
    </div>
  `;
  
  await sendEmail(email, subjectLine, html);
};

export default transporter;
