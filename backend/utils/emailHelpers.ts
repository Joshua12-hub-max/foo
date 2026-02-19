import { eq } from 'drizzle-orm';
import { recruitmentEmailTemplates } from '../db/schema.js';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import nodemailer from 'nodemailer';

/**
 * Send an email notification
 */
export const sendEmailNotification = async (to: string, subject: string, html: string, attachments: object[] = []): Promise<void> => {
  console.log(`Attempting to send email to: ${to}`);
  console.log(`Subject: ${subject}`);
  // console.log(`Using EMAIL_USER: ${process.env.EMAIL_USER}`); // security risk to log
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

/**
 * Email template row from database (matching Drizzle schema)
 */
interface EmailTemplate {
  id: number;
  stage_name: string;
  subject_template: string;
  body_template: string;
  available_variables?: string | null;
  updated_at: string | null;
}

/**
 * Variables for template replacement
 */
type TemplateVariables = Record<string, string | undefined>;

/**
 * Get email template for a specific recruitment stage
 * @param db - Drizzle database instance
 * @param stageName - Name of the recruitment stage
 * @returns Template object or null if not found
 */
export const getTemplateForStage = async (
  db: MySql2Database<any>,
  stageName: string
): Promise<EmailTemplate | null> => {
  try {
    const templates = await db.select()
      .from(recruitmentEmailTemplates)
      .where(eq(recruitmentEmailTemplates.stage_name, stageName));
    
    if (templates.length > 0) {
      return templates[0];
    }
    return null;
  } catch (error) {
    console.error('Error fetching email template:', error);
    return null;
  }
};

/**
 * Replace template variables with actual values
 * @param template - Template string with {{variable}} placeholders
 * @param variables - Object containing variable values
 * @returns Template with variables replaced
 */
export const replaceVariables = (
  template: string,
  variables: TemplateVariables
): string => {
  let content = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, value ?? '');
  }
  
  return content;
};
