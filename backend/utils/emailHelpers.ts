import { eq } from 'drizzle-orm';
import { SendMailOptions } from 'nodemailer';
import { recruitmentEmailTemplates } from '../db/schema.js';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { sendEmail } from './emailUtils.js';

/**
 * Send an email notification using the secure shared transporter
 */
export const sendEmailNotification = async (to: string, subject: string, html: string, attachments: SendMailOptions['attachments'] = []): Promise<void> => {
  try { 
    console.warn(`[NOTIFY DEBUG] Preparing notification for ${to}`);
    await sendEmail(to, subject, html, attachments);
    console.warn(`[NOTIFY DEBUG] Notification sent for ${to}`);
  } catch (error: unknown) { 
    console.error(`[NOTIFY ERROR] FULL FAILURE for email to ${to}:`, (error as Error).message); 
    if ((error as Error).stack) console.error(`[NOTIFY ERROR] Stack:`, (error as Error).stack);
  }
};


/**
 * Email template row from database (matching Drizzle schema)
 */
interface EmailTemplate {
  id: number;
  stageName: string;
  subjectTemplate: string;
  bodyTemplate: string;
  availableVariables?: string | null;
  updatedAt: string | null;
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
export const getTemplateForStage = async <TSchema extends Record<string, unknown>>(
  db: MySql2Database<TSchema>,
  stageName: string
): Promise<EmailTemplate | null> => {
  try {
    const templates = await db.select()
      .from(recruitmentEmailTemplates)
      .where(eq(recruitmentEmailTemplates.stageName, stageName));
    
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
    // 100% PRECISION: Replace double braces BEFORE single braces to prevent partial matching
    const doubleRegex = new RegExp(`{{${key}}}`, 'g');
    const singleRegex = new RegExp(`{${key}}`, 'g');
    const replacement = value ?? '';
    
    content = content.replace(doubleRegex, replacement)
                     .replace(singleRegex, replacement);
  }
  
  return content;
};

/**
 * Prepare template variables by ensuring both camelCase and snake_case versions exist.
 * This ensures compatibility with templates using either {jobTitle} or {job_title} syntax.
 * @param variables - Original variables object
 * @returns Enhanced variables object with both casing styles
 */
export const prepareEmailVariables = (variables: TemplateVariables): TemplateVariables => {
  const enhanced: TemplateVariables = { ...variables };
  
  for (const [key, value] of Object.entries(variables)) {
    // Convert camelCase to snake_case: applicantFirstName -> applicant_first_name
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    if (snakeKey !== key) {
      enhanced[snakeKey] = value;
    }
  }
  
  return enhanced;
};
