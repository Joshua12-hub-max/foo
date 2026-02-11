import { eq } from 'drizzle-orm';
import { recruitmentEmailTemplates } from '../db/schema.js';
import type { MySql2Database } from 'drizzle-orm/mysql2';

/**
 * Email template row from database (matching Drizzle schema)
 */
interface EmailTemplate {
  id: number;
  stageName: string;
  subjectTemplate: string;
  bodyTemplate: string;
  availableVariables?: string | null;
  updatedAt: string | null; // Using snake_case column names as properties if using select() without explicit mapping? 
  // Wait, Drizzle select() returns camelCase properties if defined in schema? No, it returns whatever property name is defined.
  // In `schema.ts`: `updatedAt: timestamp("updated_at", ...)` -> property is `updatedAt`.
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
