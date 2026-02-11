import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { recruitmentEmailTemplates } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';

// ============================================================================
// Interfaces
// ============================================================================

interface UpdateTemplateRequest {
  subject_template: string;
  body_template: string;
}

// ============================================================================
// Controllers
// ============================================================================

export const getTemplates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const templates = await db.select()
      .from(recruitmentEmailTemplates)
      .orderBy(asc(recruitmentEmailTemplates.id));
      
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch email templates' });
  }
};

export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { subject_template, body_template }: UpdateTemplateRequest = req.body;

    await db.update(recruitmentEmailTemplates)
      .set({ 
        subjectTemplate: subject_template, 
        bodyTemplate: body_template 
      })
      .where(eq(recruitmentEmailTemplates.id, Number(id)));

    res.json({ success: true, message: 'Template updated successfully' });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, message: 'Failed to update template' });
  }
};
