import { Request, Response } from 'express';
import db from '../db/connection.js';
import type { RowDataPacket } from 'mysql2/promise';

// ============================================================================
// Interfaces
// ============================================================================

interface EmailTemplateRow extends RowDataPacket {
  id: number;
  stage_name: string;
  subject_template: string;
  body_template: string;
  created_at: Date;
  updated_at: Date;
}

interface UpdateTemplateRequest {
  subject_template: string;
  body_template: string;
}

// ============================================================================
// Controllers
// ============================================================================

export const getTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const [templates] = await db.query<EmailTemplateRow[]>(
      'SELECT * FROM recruitment_email_templates ORDER BY id'
    );
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

    await db.query(
      'UPDATE recruitment_email_templates SET subject_template = ?, body_template = ? WHERE id = ?',
      [subject_template, body_template, id]
    );

    res.json({ success: true, message: 'Template updated successfully' });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, message: 'Failed to update template' });
  }
};
