import type { Pool, RowDataPacket } from 'mysql2/promise';

/**
 * Email template row from database
 */
interface EmailTemplate extends RowDataPacket {
  id: number;
  stage_name: string;
  subject: string;
  body: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Variables for template replacement
 */
type TemplateVariables = Record<string, string | undefined>;

/**
 * Get email template for a specific recruitment stage
 * @param db - Database connection pool
 * @param stageName - Name of the recruitment stage
 * @returns Template object or null if not found
 */
export const getTemplateForStage = async (
  db: Pool,
  stageName: string
): Promise<EmailTemplate | null> => {
  try {
    const [templates] = await db.query<EmailTemplate[]>(
      'SELECT * FROM recruitment_email_templates WHERE stage_name = ?',
      [stageName]
    );
    
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
