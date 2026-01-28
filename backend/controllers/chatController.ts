import { Request, Response } from 'express';
import db from '../db/connection.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';

interface ConversationRow extends RowDataPacket {
  id: number;
  applicant_name: string;
  applicant_email: string;
  status: string;
  created_at: Date;
  unread_count?: number;
}

interface MessageRow extends RowDataPacket {
  id: number;
  conversation_id: number;
  sender_type: string;
  message: string;
  created_at: Date;
}

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
    const [existing] = await db.query<ConversationRow[]>(
      `SELECT * FROM chat_conversations WHERE applicant_email = ? AND status = 'Active' LIMIT 1`,
      [email]
    );

    if (existing.length > 0) {
      res.json({ success: true, conversation: existing[0] });
      return;
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO chat_conversations (applicant_name, applicant_email) VALUES (?, ?)`,
      [name, email]
    );

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

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO chat_messages (conversation_id, sender_type, sender_id, message) VALUES (?, ?, ?, ?)`,
      [conversation_id, sender_type, sender_id, message]
    );

    // Update conversation's updated_at
    await db.query(`UPDATE chat_conversations SET updated_at = NOW() WHERE id = ?`, [conversation_id]);

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
    const { mark_read } = req.query;

    const [messages] = await db.query<MessageRow[]>(
      `SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC`,
      [conversationId]
    );

    if (mark_read === 'true') {
        const sender_type_to_mark = req.query.reader === 'Admin' ? 'Applicant' : 'Admin';
        await db.query(
            `UPDATE chat_messages SET is_read = TRUE WHERE conversation_id = ? AND sender_type = ?`,
            [conversationId, sender_type_to_mark]
        );
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
export const getActiveConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const [conversations] = await db.query<ConversationRow[]>(`
      SELECT c.*, 
      (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id AND m.is_read = FALSE AND m.sender_type = 'Applicant') as unread_count,
      (SELECT message FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message
      FROM chat_conversations c 
      WHERE c.status = 'Active' 
      ORDER BY c.updated_at DESC
    `);
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
    await db.query(`UPDATE chat_conversations SET status = 'Closed' WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Conversation closed' });
  } catch (error) {
    console.error('Close Conversation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to close conversation' });
  }
};
