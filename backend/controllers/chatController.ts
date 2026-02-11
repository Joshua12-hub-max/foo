import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { chatConversations, chatMessages } from '../db/schema.js';
import { eq, and, desc, sql, asc } from 'drizzle-orm';
import type { AuthenticatedRequest } from '../types/index.js';

/**
 * Public: Start or Resume Conversation
 * POST /api/chat/start
 */
export const startConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      res.status(400).json({ success: false, message: 'Name and email are required' });
      return;
    }

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
      applicantName: name,
      applicantEmail: email,
      status: 'Active'
    });

    res.status(201).json({ 
      success: true, 
      conversation: { id: result.insertId, applicant_name: name, applicant_email: email } 
    });
  } catch (error) {
    console.error('Start Conversation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to start chat' });
  }
};

/**
 * Public/Admin: Send Message
 * POST /api/chat/message
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversation_id, message, sender_type } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (!conversation_id || !message || !sender_type) {
      res.status(400).json({ success: false, message: 'Missing parameters' });
      return;
    }

    const sender_id = sender_type === 'Admin' ? authReq.user?.id : null;

    const [result] = await db.insert(chatMessages).values({
      conversationId: Number(conversation_id),
      senderType: sender_type as any,
      senderId: sender_id,
      message,
      isRead: 0
    });

    // Update conversation's updated_at
    await db.update(chatConversations)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(chatConversations.id, Number(conversation_id)));

    res.status(201).json({ success: true, message_id: result.insertId });
  } catch (error) {
    console.error('Send Message Error:', error);
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

    if (mark_read === 'true') {
        const sender_type_to_mark = reader === 'Admin' ? 'Applicant' : 'Admin';
        await db.update(chatMessages)
          .set({ isRead: 1 })
          .where(and(
            eq(chatMessages.conversationId, Number(conversationId)),
            eq(chatMessages.senderType, sender_type_to_mark as any)
          ));
    }

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Get Messages Error:', error);
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
      // Use subqueries for aggregated data
      unreadCount: sql<number>`(SELECT COUNT(*) FROM ${chatMessages} WHERE ${chatMessages.conversationId} = ${chatConversations.id} AND ${chatMessages.isRead} = 0 AND ${chatMessages.senderType} = 'Applicant')`,
      lastMessage: sql<string>`(SELECT ${chatMessages.message} FROM ${chatMessages} WHERE ${chatMessages.conversationId} = ${chatConversations.id} ORDER BY ${chatMessages.createdAt} DESC LIMIT 1)`
    })
    .from(chatConversations)
    .where(eq(chatConversations.status, 'Active'))
    .orderBy(desc(chatConversations.updatedAt));

    res.json({ success: true, conversations });
  } catch (error) {
    console.error('Get Active Conversations Error:', error);
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
    console.error('Close Conversation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to close conversation' });
  }
};
