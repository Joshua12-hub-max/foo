import { eq } from 'drizzle-orm';
import { recruitmentEmailTemplates } from '../db/schema.js';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { sendEmail } from './emailUtils.js';

/**
 * Send an email notification using the secure shared transporter
 */
export const sendEmailNotification = async (to: string, subject: string, html: string, attachments: unknown[] = []): Promise<void> => {
  try { 
    await sendEmail(to, subject, html, attachments);
  } catch (error: unknown) { 
    console.error(`[NOTIFY ERROR] Failed to send email to ${to}:`, error.message); 
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
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, value ?? '');
  }
  
  return content;
};
