import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { contactInquiries } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import nodemailer from 'nodemailer';

/**
 * Utility: Send Email Notification
 */
const sendNotification = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER || '"Meycauayan HR" <no-reply@meycauayan.gov.ph>',
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Email Notification Error:', error);
  }
};

/**
 * Public: Submit Inquiry
 * POST /api/inquiries
 */
export const submitInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { first_name, last_name, email, message } = req.body;

    if (!first_name || !last_name || !email || !message) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    const [result] = await db.insert(contactInquiries).values({
      first_name,
      last_name,
      email,
      message,
      status: 'Pending'
    });

    // 1. Send confirmation to User
    await sendNotification(
      email,
      'We received your inquiry - Meycauayan HR',
      `<div style="font-family: sans-serif; padding: 20px;">
        <h2>Hello ${first_name},</h2>
        <p>Thank you for reaching out to the City Human Resources Management Office of Meycauayan. We have received your message and our team will get back to you within 24-48 hours.</p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>Your Message:</strong><br/>
          <i>"${message}"</i>
        </div>
        <p>Best regards,<br/><strong>Meycauayan HR Team</strong></p>
      </div>`
    );

    // 2. Notify HR Admin
    const hrEmail = process.env.HR_ADMIN_EMAIL || process.env.EMAIL_USER;
    if (hrEmail) {
      await sendNotification(
        hrEmail,
        'NEW INQUIRY: ' + first_name + ' ' + last_name,
        `<div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #1e293b;">New Public Inquiry Received</h2>
          <p><strong>From:</strong> ${first_name} ${last_name} (${email})</p>
          <p><strong>Message:</strong></p>
          <div style="background: #e2e8f0; padding: 15px; border-radius: 8px;">
            ${message}
          </div>
          <p style="margin-top: 20px;">
            <a href="${process.env.FRONTEND_URL}/admin-dashboard/inquiries" style="background: #0f172a; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">View in Admin Portal</a>
          </p>
        </div>`
      );
    }

    res.status(201).json({ 
      success: true, 
      message: 'Inquiry submitted successfully. We have sent a confirmation to your email.',
      id: result.insertId 
    });
  } catch (error) {
    console.error('Submit Inquiry Error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit inquiry. Please try again later.' });
  }
};

/**
 * Admin: Get All Inquiries
 * GET /api/inquiries
 */
export const getInquiries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    
    const conditions = [];
    if (status && status !== 'All') {
      conditions.push(eq(contactInquiries.status, status as any));
    }

    const inquiries = await db.select()
      .from(contactInquiries)
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .orderBy(desc(contactInquiries.created_at));

    res.json({ success: true, inquiries });
  } catch (error) {
    console.error('Get Inquiries Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inquiries' });
  }
};

/**
 * Admin: Update Status
 * PATCH /api/inquiries/:id/status
 */
export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    if (!status) {
      res.status(400).json({ success: false, message: 'Status is required' });
      return;
    }

    const updateData: any = { status: status as any };
    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes || null;
    }

    await db.update(contactInquiries)
      .set(updateData)
      .where(eq(contactInquiries.id, Number(id)));

    res.json({ success: true, message: 'Inquiry status updated' });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

/**
 * Admin: Delete Inquiry
 * DELETE /api/inquiries/:id
 */
export const deleteInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.delete(contactInquiries).where(eq(contactInquiries.id, Number(id)));
    res.json({ success: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('Delete Inquiry Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete inquiry' });
  }
};
