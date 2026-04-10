import { Request, Response } from 'express';
import { ResultSetHeader } from 'mysql2';
import { db } from '../db/index.js';
import { chatConversations, chatMessages } from '../db/schema.js';
import { eq, and, desc, sql, asc } from 'drizzle-orm';
import { isDisposableEmail, sanitizeInput, isWithinMaxLength } from '../utils/spamUtils.js';
import { chatStartSchema } from '../schemas/inquirySchema.js';
import { ZodError } from 'zod';
import type { AuthenticatedRequest } from '../types/index.js';

// Maximum message length to prevent abuse
const MAX_MESSAGE_LENGTH = 2000;

// Valid sender types for strict type checking
const VALID_SENDER_TYPES = ['Applicant', 'Administrator'] as const;
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
    const validatedData = chatStartSchema.parse(req.body);
    const { name, email } = validatedData;

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
      conversation: { id: (result as ResultSetHeader).insertId, applicantName: sanitizedName, applicantEmail: email } 
    });
  } catch (error: unknown) {
    console.error('[Server] startConversation error:', error);
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
    const { conversationId, message, senderType } = req.body as { conversationId: string | number; message: string; senderType: string };
    const authReq = req as AuthenticatedRequest;

    if (!conversationId || !message || !senderType) {
      res.status(400).json({ success: false, message: 'Missing parameters' });
      return;
    }

    // Anti-Spam: Validate sender type strictly (no `as never`)
    if (typeof senderType !== 'string' || !isSenderType(senderType)) {
      res.status(400).json({ success: false, message: 'Invalid sender type. Must be "Applicant" or "Administrator".' });
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

    // Verify conversation existence
    const conversation = await db.query.chatConversations.findFirst({
        where: eq(chatConversations.id, Number(conversationId))
    });

    if (!conversation) {
        res.status(404).json({ success: false, message: 'Conversation not found' });
        return;
    }

    const senderId = senderType === 'Administrator' ? authReq.user?.id : null;
    const sanitizedMessage = sanitizeInput(message);

    const [result] = await db.insert(chatMessages).values({
      conversationId: Number(conversationId),
      senderType: senderType,
      senderId: senderId,
      message: sanitizedMessage,
      isRead: false
    });

    // Update conversation's updated_at to bump it to the top of the list
    // Use sql`now()` to avoid JS/MySQL date format mismatches
    await db.update(chatConversations)
      .set({ updatedAt: sql`now()` })
      .where(eq(chatConversations.id, Number(conversationId)));

    const insertedId = (result as ResultSetHeader).insertId;
    const [newMessage] = await db.select().from(chatMessages).where(eq(chatMessages.id, insertedId));

    res.status(201).json({ success: true, message: newMessage });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      res.status(400).json({ 
        success: false, 
        message: error.issues[0].message || 'Validation failed',
        errors: error.flatten().fieldErrors 
      });
      return;
    }
    console.error('[Server] sendMessage error:', error);
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
    const { markRead, reader } = req.query;

    const messages = await db.select({
      id: chatMessages.id,
      conversationId: chatMessages.conversationId,
      senderType: chatMessages.senderType,
      senderId: chatMessages.senderId,
      message: chatMessages.message,
      isRead: chatMessages.isRead,
      isEdited: chatMessages.isEdited,
      isDeletedForEveryone: chatMessages.isDeletedForEveryone,
      deletedByApplicant: chatMessages.deletedByApplicant,
      deletedByAdministrator: chatMessages.deletedByAdministrator,
      createdAt: chatMessages.createdAt,
      adminAvatar: sql<string>`(SELECT avatar_url FROM authentication WHERE id = ${chatMessages.senderId} LIMIT 1)`,
      applicantAvatar: sql<string>`(SELECT ra.photo_path FROM recruitment_applicants ra JOIN chat_conversations cc ON ra.email = cc.applicant_email WHERE cc.id = ${chatMessages.conversationId} LIMIT 1)`
    })
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, Number(conversationId)))
      .orderBy(asc(chatMessages.createdAt));

    if (markRead === 'true' && typeof reader === 'string' && isSenderType(reader)) {
        const senderTypeToMark: SenderType = reader === 'Administrator' ? 'Applicant' : 'Administrator';
        await db.update(chatMessages)
          .set({ isRead: true })
          .where(and(
            eq(chatMessages.conversationId, Number(conversationId)),
            eq(chatMessages.senderType, senderTypeToMark)
          ));
    }

    // Map messages to handle "Deleted for Everyone" and "Deleted for Me"
    // Note: Filtering for "Deleted for Me" happens on the client or here if we know the reader
    const filteredMessages = messages.map(msg => {
        if (msg.isDeletedForEveryone) {
            return {
                ...msg,
                message: "This message was removed",
                isEdited: false
            };
        }
        return msg;
    }).filter(msg => {
        if (typeof reader === 'string' && isSenderType(reader)) {
            if (reader === 'Applicant' && msg.deletedByApplicant) return false;
            if (reader === 'Administrator' && msg.deletedByAdministrator) return false;
        }
        return true;
    });

    res.json({ success: true, messages: filteredMessages });
  } catch (error: unknown) {
    console.error('[Server] getMessages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};

/**
 * Public/Admin: Edit Message
 * PATCH /api/chat/message/:id
 */
export const editMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { message, senderType } = req.body as { message: string; senderType: string };
    const authReq = req as AuthenticatedRequest;

    if (!message || !senderType || !isSenderType(senderType)) {
      res.status(400).json({ success: false, message: 'Invalid parameters' });
      return;
    }

    const sanitizedMessage = sanitizeInput(message);
    if (!isWithinMaxLength(sanitizedMessage, MAX_MESSAGE_LENGTH)) {
      res.status(400).json({ success: false, message: 'Message too long' });
      return;
    }

    const existing = await db.query.chatMessages.findFirst({
        where: eq(chatMessages.id, Number(id))
    });

    if (!existing) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
    }

    // Permission check: only sender can edit
    if (existing.senderType !== senderType) {
        res.status(403).json({ success: false, message: `Unauthorized: Sender type mismatch. Expected ${existing.senderType}, got ${senderType}` });
        return;
    }

    if (senderType === 'Administrator') {
        const userRole = authReq.user?.role;
        const isAdminOrHR = userRole === 'Administrator' || userRole === 'Human Resource';
        
        if (!isAdminOrHR) {
            res.status(403).json({ success: false, message: 'Unauthorized: Administrator or HR role required to edit admin messages' });
            return;
        }

        // Ownership check: must be the sender
        // Fallback: If senderId is null (legacy/buggy messages), allow any admin to edit for maintenance
        if (existing.senderId && existing.senderId !== authReq.user?.id) {
            res.status(403).json({ success: false, message: `Unauthorized: You can only edit your own messages. Message owner ID: ${existing.senderId}, Your ID: ${authReq.user?.id}` });
            return;
        }
    } else {
        // Applicant: Verify conversation ownership
        const { conversationId } = req.body as { conversationId?: string | number };
        if (!conversationId || existing.conversationId !== Number(conversationId)) {
            res.status(403).json({ success: false, message: 'Unauthorized: Message ownership conflict or missing conversation ID' });
            return;
        }
    }

    await db.update(chatMessages)
        .set({ 
            message: sanitizedMessage, 
            isEdited: true 
        })
        .where(eq(chatMessages.id, Number(id)));

    res.json({ success: true, message: 'Message updated' });
  } catch (error: unknown) {
    console.error('[Server] editMessage error:', error);
    res.status(500).json({ success: false, message: 'Failed to edit message' });
  }
};

/**
 * Public/Admin: Delete Message
 * DELETE /api/chat/message/:id
 */
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { type, senderType, conversationId } = req.query as { type: string; senderType: string; conversationId?: string };

        if (!senderType || !isSenderType(senderType)) {
            res.status(400).json({ success: false, message: 'Invalid sender type' });
            return;
        }

        const existing = await db.query.chatMessages.findFirst({
            where: eq(chatMessages.id, Number(id))
        });

        if (!existing) {
            res.status(404).json({ success: false, message: 'Message not found' });
            return;
        }

        if (senderType === 'Administrator') {
            // Administrator moderation: can delete ANY message (everyone) or just their own (me)
            if (type === 'everyone') {
                await db.update(chatMessages)
                    .set({ isDeletedForEveryone: true })
                    .where(eq(chatMessages.id, Number(id)));
            } else {
                await db.update(chatMessages)
                    .set({ deletedByAdministrator: true })
                    .where(eq(chatMessages.id, Number(id)));
            }
        } else {
            // Applicant: Verify ownership
            if (existing.senderType !== 'Applicant' || (conversationId && existing.conversationId !== Number(conversationId))) {
                res.status(403).json({ success: false, message: 'Unauthorized (Message ownership conflict)' });
                return;
            }

            if (type === 'everyone') {
                await db.update(chatMessages)
                    .set({ isDeletedForEveryone: true })
                    .where(eq(chatMessages.id, Number(id)));
            } else {
                await db.update(chatMessages)
                    .set({ deletedByApplicant: true })
                    .where(eq(chatMessages.id, Number(id)));
            }
        }

        res.json({ success: true, message: 'Message deleted' });
    } catch (error: unknown) {
        console.error('[Server] deleteMessage error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
};

/**
 * Public/Admin: Get Unread Count for a conversation
 * GET /api/chat/unread-count/:conversationId
 */
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { role } = req.query as { role?: 'Applicant' | 'Administrator' };

    // Default to 'Applicant' seeing unread messages from 'Administrator'
    // If 'Administrator', they see unread from 'Applicant'
    const targetSenderType = role === 'Administrator' ? 'Applicant' : 'Administrator';

    const [result] = await db.select({
      count: sql<number>`COUNT(*)`
    })
    .from(chatMessages)
    .where(and(
      eq(chatMessages.conversationId, Number(conversationId)),
      eq(chatMessages.senderType, targetSenderType),
      eq(chatMessages.isRead, false)
    ));

    res.json({ success: true, count: Number(result?.count || 0) });
  } catch (error: unknown) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
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
      // Join with applicants to get photo
      applicantAvatar: sql<string>`(SELECT photo_path FROM recruitment_applicants WHERE email = ${chatConversations.applicantEmail} LIMIT 1)`,
      unreadCount: sql<number>`(SELECT COUNT(*) FROM ${chatMessages} WHERE ${chatMessages.conversationId} = ${chatConversations.id} AND ${chatMessages.isRead} = 0 AND ${chatMessages.senderType} = 'Applicant')`,
      lastMessage: sql<string>`(SELECT ${chatMessages.message} FROM ${chatMessages} WHERE ${chatMessages.conversationId} = ${chatConversations.id} ORDER BY ${chatMessages.createdAt} DESC LIMIT 1)`
    })
    .from(chatConversations)
    .where(eq(chatConversations.status, 'Active'))
    .orderBy(desc(chatConversations.updatedAt));

    res.json({ success: true, conversations });
  } catch (error: unknown) {
    console.error('[Server] getActiveConversations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
  }
};

/**
 * Public/Admin: Delete Entire Conversation
 * DELETE /api/chat/conversations/:id
 */
export const deleteConversation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { senderType } = req.query as { senderType: string };

        if (!senderType || !isSenderType(senderType)) {
            res.status(400).json({ success: false, message: 'Invalid sender type' });
            return;
        }

        // For Applicants, we double-check the conversation exists and matches the ID
        // (In a more robust system, we would check a session token)
        const existing = await db.query.chatConversations.findFirst({
            where: eq(chatConversations.id, Number(id))
        });

        if (!existing) {
            res.status(404).json({ success: false, message: 'Conversation not found' });
            return;
        }

        // Hard delete conversation and messages
        await db.delete(chatMessages).where(eq(chatMessages.conversationId, Number(id)));
        await db.delete(chatConversations).where(eq(chatConversations.id, Number(id)));

        res.json({ success: true, message: 'Conversation and all history permanently deleted' });
    } catch (error: unknown) {
        console.error('[Server] deleteConversation error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete conversation' });
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
  } catch (error: unknown) {
    console.error('[Server] closeConversation error:', error);
    res.status(500).json({ success: false, message: 'Failed to close conversation' });
  }
};

/**
 * Admin: Get Total Unread Count (all conversations)
 * GET /api/chat/admin/unread-total
 */
export const getAdminUnreadTotal = async (_req: Request, res: Response): Promise<void> => {
    try {
      const [result] = await db.select({
        count: sql<number>`COUNT(*)`
      })
      .from(chatMessages)
      .where(and(
        eq(chatMessages.senderType, 'Applicant'),
        eq(chatMessages.isRead, false)
      ));
  
      res.json({ success: true, count: Number(result?.count || 0) });
    } catch (error: unknown) {
      console.error('Get admin unread total error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch total unread count' });
    }
  };
