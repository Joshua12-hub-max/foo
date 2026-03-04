import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { chatConversations, chatMessages } from '../db/schema.js';
import { eq, and, desc, sql, asc } from 'drizzle-orm';
import { isDisposableEmail, isValidEmailFormat, sanitizeInput, isWithinMaxLength } from '../utils/spamUtils.js';
import type { AuthenticatedRequest } from '../types/index.js';

// Maximum message length to prevent abuse
const MAX_MESSAGE_LENGTH = 2000;
// Maximum name length
const MAX_NAME_LENGTH = 100;

// Valid sender types for strict type checking
const VALID_SENDER_TYPES = ['Applicant', 'Admin'] as const;
type SenderType = typeof VALID_SENDER_TYPES[number];

const isSenderType = (value: string): value is SenderType => {
  return VALID_SENDER_TYPES.includes(value as SenderType);
};

/**
 * Public: Start or Resume Conversation
 * POST /api/chat/start
 * Anti-Spam: Email validation + Disposable email check
 */
export const startConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      res.status(400).json({ success: false, message: 'Name and email are required' });
      return;
    }

    // Anti-Spam: Validate name length
    if (typeof name !== 'string' || !isWithinMaxLength(name, MAX_NAME_LENGTH)) {
      res.status(400).json({ success: false, message: `Name must be ${MAX_NAME_LENGTH} characters or less` });
      return;
    }

    // Anti-Spam: Validate email format
    if (typeof email !== 'string' || !isValidEmailFormat(email)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address' });
      return;
    }

    // Anti-Spam: Block disposable emails
    if (isDisposableEmail(email)) {
      res.status(400).json({ success: false, message: 'Disposable email addresses are not allowed. Please use a real email.' });
      return;
    }

    const sanitizedName = sanitizeInput(name);

    // Check if there's an active conversation for this email
    const existing = await db.query.chatConversations.findFirst({
      where: and(
        eq(chatConversations.applicantEmail, email),
        eq(chatConversations.status, 'Active')
      )
    });

    if (existing) {
      res.json({ success: true, conversation: existing });
      return;
    }

    const [result] = await db.insert(chatConversations).values({
      applicantName: sanitizedName,
      applicantEmail: email,
      status: 'Active'
    });

    res.status(201).json({ 
      success: true, 
      conversation: { id: result.insertId, applicant_name: sanitizedName, applicant_email: email } 
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Start Conversation Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to start chat' });
  }
};

/**
 * Public/Admin: Send Message
 * POST /api/chat/message
 * Anti-Spam: Message length cap + XSS sanitization + Strict sender type
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversation_id, message, sender_type } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (!conversation_id || !message || !sender_type) {
      res.status(400).json({ success: false, message: 'Missing parameters' });
      return;
    }

    // Anti-Spam: Validate sender type strictly (no `as any`)
    if (typeof sender_type !== 'string' || !isSenderType(sender_type)) {
      res.status(400).json({ success: false, message: 'Invalid sender type. Must be "Applicant" or "Admin".' });
      return;
    }

    // Anti-Spam: Validate message is a string
    if (typeof message !== 'string') {
      res.status(400).json({ success: false, message: 'Message must be a string' });
      return;
    }

    // Anti-Spam: Message length cap
    if (!isWithinMaxLength(message, MAX_MESSAGE_LENGTH)) {
      res.status(400).json({ success: false, message: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` });
      return;
    }

    // Anti-Spam: Sanitize message content
    const sanitizedMessage = sanitizeInput(message);

    const sender_id = sender_type === 'Admin' ? authReq.user?.id : null;

    const [result] = await db.insert(chatMessages).values({
      conversationId: Number(conversation_id),
      senderType: sender_type,
      senderId: sender_id,
      message: sanitizedMessage,
      isRead: false
    });

    // Update conversation's updated_at
    await db.update(chatConversations)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(chatConversations.id, Number(conversation_id)));

    res.status(201).json({ success: true, message_id: result.insertId });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Send Message Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

/**
 * Public/Admin: Get Messages
 * GET /api/chat/messages/:conversationId
 */
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { mark_read, reader } = req.query;

    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, Number(conversationId)))
      .orderBy(asc(chatMessages.createdAt));

    if (mark_read === 'true' && typeof reader === 'string' && isSenderType(reader)) {
        const sender_type_to_mark: SenderType = reader === 'Admin' ? 'Applicant' : 'Admin';
        await db.update(chatMessages)
          .set({ isRead: true })
          .where(and(
            eq(chatMessages.conversationId, Number(conversationId)),
            eq(chatMessages.senderType, sender_type_to_mark)
          ));
    }

    res.json({ success: true, messages });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Get Messages Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

/**
 * Admin: List All Active Conversations
 * GET /api/chat/conversations
 */
export const getActiveConversations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const conversations = await db.select({
      id: chatConversations.id,
      applicantName: chatConversations.applicantName,
      applicantEmail: chatConversations.applicantEmail,
      status: chatConversations.status,
      createdAt: chatConversations.createdAt,
      updatedAt: chatConversations.updatedAt,
      unreadCount: sql<number>`(SELECT COUNT(*) FROM ${chatMessages} WHERE ${chatMessages.conversationId} = ${chatConversations.id} AND ${chatMessages.isRead} = 0 AND ${chatMessages.senderType} = 'Applicant')`,
      lastMessage: sql<string>`(SELECT ${chatMessages.message} FROM ${chatMessages} WHERE ${chatMessages.conversationId} = ${chatConversations.id} ORDER BY ${chatMessages.createdAt} DESC LIMIT 1)`
    })
    .from(chatConversations)
    .where(eq(chatConversations.status, 'Active'))
    .orderBy(desc(chatConversations.updatedAt));

    res.json({ success: true, conversations });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Get Active Conversations Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

/**
 * Admin: Close Conversation
 * PATCH /api/chat/conversations/:id/close
 */
export const closeConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.update(chatConversations)
      .set({ status: 'Closed' })
      .where(eq(chatConversations.id, Number(id)));
    res.json({ success: true, message: 'Conversation closed' });
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    console.error('Close Conversation Error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to close conversation' });
  }
};
