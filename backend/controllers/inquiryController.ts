import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { contactInquiries } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { isDisposableEmail, isValidEmailFormat, sanitizeInput, isWithinMaxLength } from '../utils/spamUtils.js';

// Validation constants
const MAX_MESSAGE_LENGTH = 5000;
const MAX_NAME_LENGTH = 100;

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
  } catch (_error) {
    /* empty */
  }
};

/**
 * Public: Submit Inquiry
 * POST /api/inquiries
 * Anti-Spam: Email validation + Disposable block + Length caps + XSS sanitization
 */
export const submitInquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, message } = req.body as { firstName: string; lastName: string; email: string; message: string };

    if (!firstName || !lastName || !email || !message) {
      res.status(400).json({ success: false, message: 'All fields are required' });
      return;
    }

    // Anti-Spam: Validate types
    if (typeof firstName !== 'string' || typeof lastName !== 'string' || typeof email !== 'string' || typeof message !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid input types' });
      return;
    }

    // Anti-Spam: Validate name lengths
    if (!isWithinMaxLength(firstName, MAX_NAME_LENGTH) || !isWithinMaxLength(lastName, MAX_NAME_LENGTH)) {
      res.status(400).json({ success: false, message: `Names must be ${MAX_NAME_LENGTH} characters or less` });
      return;
    }

    // Anti-Spam: Validate email format
    if (!isValidEmailFormat(email)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address' });
      return;
    }

    // Anti-Spam: Block disposable emails
    if (isDisposableEmail(email)) {
      res.status(400).json({ success: false, message: 'Disposable email addresses are not allowed. Please use a real email.' });
      return;
    }

    // Anti-Spam: Message length cap
    if (!isWithinMaxLength(message, MAX_MESSAGE_LENGTH)) {
      res.status(400).json({ success: false, message: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` });
      return;
    }

    // Anti-Spam: Sanitize all user inputs (especially message — embedded in HTML emails)
    const safeFirstName = sanitizeInput(firstName);
    const safeLastName = sanitizeInput(lastName);
    const safeMessage = sanitizeInput(message);

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
  } catch (_error) {res.status(500).json({ success: false, message: 'Failed to submit inquiry. Please try again later.' });
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
  } catch (_error) {res.status(500).json({ success: false, message: 'Failed to fetch inquiries' });
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
  } catch (_error) {res.status(500).json({ success: false, message: 'Failed to update status' });
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
  } catch (_error) {res.status(500).json({ success: false, message: 'Failed to delete inquiry' });
  }
};


