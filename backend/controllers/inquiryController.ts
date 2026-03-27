import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { contactInquiries } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { isDisposableEmail, sanitizeInput } from '../utils/spamUtils.js';
import { inquirySchema } from '../schemas/inquirySchema.js';
import { ZodError } from 'zod';

// Valid inquiry statuses for strict type checking
const VALID_INQUIRY_STATUSES = ['Pending', 'Read', 'Replied', 'Archived'] as const;
type InquiryStatus = typeof VALID_INQUIRY_STATUSES[number];

const isInquiryStatus = (value: string): value is InquiryStatus => {
  return VALID_INQUIRY_STATUSES.includes(value as InquiryStatus);
};

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
      from: process.env.EMAIL_USER || '"Meycauayan HR" <chrmomeyc.jobs@gmail.com>',
      to,
      subject,
      html
    });
  } catch (error: unknown) {
    console.error('[Server] sendNotification error:', error);
    // Don't throw, just log so the main flow can continue if email fails
  }
};

/**
 * Public: Submit Inquiry
 * POST /api/inquiries
 * Anti-Spam: Email validation + Disposable block + Length caps + XSS sanitization
 */
export const submitInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = inquirySchema.parse(req.body);
    const { firstName, lastName, email, message } = validatedData;

    // Anti-Spam: Block disposable emails
    if (isDisposableEmail(email)) {
      res.status(400).json({ success: false, message: 'Disposable email addresses are not allowed. Please use a real email.' });
      return;
    }

    // Anti-Spam: Sanitize all user inputs
    const safeFirstName = sanitizeInput(firstName);
    const safeLastName = sanitizeInput(lastName);
    const safeMessage = sanitizeInput(message || '');

    const [result] = await db.insert(contactInquiries).values({
      firstName: safeFirstName,
      lastName: safeLastName,
      email,
      message: safeMessage,
      status: 'Pending'
    });

    // 1. Send confirmation to User (uses sanitized content)
    await sendNotification(
      email,
      'We received your inquiry - Meycauayan HR',
      `<div style="font-family: sans-serif; padding: 20px;">
        <h2>Hello ${safeFirstName},</h2>
        <p>Thank you for reaching out to the City Human Resource Management Office of Meycauayan. We have received your message and our team will get back to you within 24-48 hours.</p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <strong>Your Message:</strong><br/>
          <i>"${safeMessage}"</i>
        </div>
        <p>Best regards,<br/><strong>Meycauayan HR Team</strong></p>
      </div>`
    );

    // 2. Notify HR Admin (uses sanitized content — prevents XSS via email)
    const hrEmail = process.env.HR_ADMIN_EMAIL || process.env.EMAIL_USER;
    if (hrEmail) {
      await sendNotification(
        hrEmail,
        'NEW INQUIRY: ' + safeFirstName + ' ' + safeLastName,
        `<div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #1e293b;">New Public Inquiry Received</h2>
          <p><strong>From:</strong> ${safeFirstName} ${safeLastName} (${email})</p>
          <p><strong>Message:</strong></p>
          <div style="background: #e2e8f0; padding: 15px; border-radius: 8px;">
            ${safeMessage}
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
  } catch (error: unknown) {
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
    if (typeof status === 'string' && status !== 'All' && isInquiryStatus(status)) {
      conditions.push(eq(contactInquiries.status, status));
    }

    const inquiries = await db.select()
      .from(contactInquiries)
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .orderBy(desc(contactInquiries.createdAt));

    res.json({ success: true, inquiries });
  } catch (error: unknown) {
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
    const body = req.body as { status?: string; adminNotes?: string };

    if (!body.status || typeof body.status !== 'string') {
      res.status(400).json({ success: false, message: 'Status is required' });
      return;
    }

    if (!isInquiryStatus(body.status)) {
      res.status(400).json({ success: false, message: 'Invalid status. Must be Pending, Read, Replied, or Archived.' });
      return;
    }

    const updateData: Partial<typeof contactInquiries.$inferInsert> = { 
        status: body.status
    };
    
    if (body.adminNotes !== undefined) {
      updateData.adminNotes = typeof body.adminNotes === 'string' ? body.adminNotes : null;
    }

    await db.update(contactInquiries)
      .set(updateData)
      .where(eq(contactInquiries.id, Number(id)));

    res.json({ success: true, message: 'Inquiry status updated' });
  } catch (error: unknown) {
    console.error('[Server] updateInquiryStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

/**
 * Admin: Reply to Inquiry
 * POST /api/inquiries/:id/reply
 */
export const replyInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body as { replyMessage: string };

    if (!replyMessage || typeof replyMessage !== 'string') {
      res.status(400).json({ success: false, message: 'Reply message is required' });
      return;
    }

    // 1. Fetch the inquiry to get the email and name
    const [inquiry] = await db.select()
      .from(contactInquiries)
      .where(eq(contactInquiries.id, Number(id)))
      .limit(1);

    if (!inquiry) {
      res.status(404).json({ success: false, message: 'Inquiry not found' });
      return;
    }

    const sanitizedReply = sanitizeInput(replyMessage);

    // 2. Send email reply
    await sendNotification(
      inquiry.email,
      'Re: Your inquiry - Meycauayan HR',
      `<div style="font-family: sans-serif; padding: 20px;">
        <h2>Hello ${inquiry.firstName},</h2>
        <p>This is a response from the City Human Resource Management Office of Meycauayan regarding your inquiry.</p>
        <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0f172a;">
          ${sanitizedReply.replace(/\n/g, '<br/>')}
        </div>
        <p>Best regards,<br/><strong>Meycauayan HR Team</strong></p>
      </div>`
    );

    // 3. Update status and save the reply in adminNotes or just update status
    // Keeping it simple: update status to 'Replied'
    // 3. Update status and store reply
    // updatedAt is automatic via .onUpdateNow() in schema
    await db.update(contactInquiries)
      .set({ 
        status: 'Replied',
        adminNotes: sql`CONCAT(COALESCE(admin_notes, ''), '\n[Reply Sent on ${new Date().toLocaleDateString()}]: ', ${sanitizedReply})`
      })
      .where(eq(contactInquiries.id, Number(id)));
    res.json({ success: true, message: 'Reply sent successfully' });
  } catch (error: unknown) {
    console.error('Reply inquiry error:', error);
    
    if (error instanceof ZodError) {
      res.status(400).json({ 
        success: false, 
        message: error.issues[0].message || 'Validation failed',
        errors: error.flatten().fieldErrors 
      });
      return;
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send reply', 
      error: errorMessage 
    });
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
  } catch (error: unknown) {
    console.error('[Server] deleteInquiry error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete inquiry' });
  }
};
/**
 * Admin: Get Pending Inquiry Count
 * GET /api/inquiries/count/pending
 */
export const countPending = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contactInquiries)
      .where(eq(contactInquiries.status, 'Pending'));

    res.json({ success: true, count: result?.count || 0 });
  } catch (error: unknown) {
    console.error('Count pending inquiries error:', error);
    res.status(500).json({ success: false, message: 'Failed to count inquiries' });
  }
};
