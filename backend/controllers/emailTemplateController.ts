import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { recruitmentEmailTemplates } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';

export const getTemplates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const templates = await db.select()
      .from(recruitmentEmailTemplates)
      .orderBy(asc(recruitmentEmailTemplates.id));
      
    res.json({ success: true, templates });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to fetch email templates' });
  }
};

export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { subjectTemplate, bodyTemplate } = req.body as { subjectTemplate: string; bodyTemplate: string };

    await db.update(recruitmentEmailTemplates)
      .set({ 
        subjectTemplate, 
        bodyTemplate 
      })
      .where(eq(recruitmentEmailTemplates.id, Number(id)));

    res.json({ success: true, message: 'Template updated successfully' });
  } catch (_error) {

    res.status(500).json({ success: false, message: 'Failed to update template' });
  }
};


