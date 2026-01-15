import { Request, Response } from 'express';
import db from '../db/connection.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';

// ============================================================================
// Interfaces
// ============================================================================

interface NotificationRow extends RowDataPacket {
  notification_id: number;
  recipient_id: string;
  sender_id?: string;
  title: string;
  message: string;
  type: string;
  reference_id?: number;
  status: 'read' | 'unread';
  created_at: Date;
}

interface AdminRow extends RowDataPacket {
  employee_id: string;
}

interface CountRow extends RowDataPacket {
  count: number;
}

interface CreateNotificationParams {
  recipientId: string;
  senderId?: string | null;
  title: string;
  message: string;
  type: string;
  referenceId?: number | null;
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Create a notification (internal helper)
 */
export const createNotification = async ({
  recipientId,
  senderId,
  title,
  message,
  type,
  referenceId
}: CreateNotificationParams): Promise<number> => {
  try {
    const [result] = await db.query<ResultSetHeader>(
      "INSERT INTO notifications (recipient_id, sender_id, title, message, type, reference_id, status) VALUES (?, ?, ?, ?, ?, ?, 'unread')",
      [recipientId, senderId || null, title, message, type, referenceId || null]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error in createNotification:', error);
    throw error;
  }
};

/**
 * Notify all admins/hr/supervisors
 */
export const notifyAdmins = async ({
  senderId,
  title,
  message,
  type,
  referenceId
}: Omit<CreateNotificationParams, 'recipientId'>): Promise<void> => {
  try {
    const [admins] = await db.query<AdminRow[]>(
      "SELECT employee_id FROM authentication WHERE role IN ('admin', 'hr', 'supervisor')"
    );

    const notificationPromises = admins.map((admin) =>
      createNotification({
        recipientId: admin.employee_id,
        senderId,
        title,
        message,
        type,
        referenceId
      })
    );

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error in notifyAdmins:', error);
  }
};

/**
 * Notify all users
 */
export const notifyAllUsers = async ({
  senderId,
  title,
  message,
  type,
  referenceId
}: Omit<CreateNotificationParams, 'recipientId'>): Promise<void> => {
  try {
    const [users] = await db.query<AdminRow[]>('SELECT employee_id FROM authentication');

    const notificationPromises = users.map((user) =>
      createNotification({
        recipientId: user.employee_id,
        senderId,
        title,
        message,
        type,
        referenceId
      })
    );

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error in notifyAllUsers:', error);
  }
};

// ============================================================================
// API Controllers
// ============================================================================

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user.employeeId || authReq.user.id;

    const [notifications] = await db.query<NotificationRow[]>(
      'SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC LIMIT 50',
      [employeeId]
    );

    const [countResult] = await db.query<CountRow[]>(
      "SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND status = 'unread'",
      [employeeId]
    );

    res.status(200).json({
      success: true,
      notifications,
      unread_count: countResult[0].count
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user.employeeId || authReq.user.id;

    const [result] = await db.query<CountRow[]>(
      "SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND status = 'unread'",
      [employeeId]
    );

    res.status(200).json({ success: true, unread_count: result[0].count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.query("UPDATE notifications SET status = 'read' WHERE notification_id = ?", [id]);
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM notifications WHERE notification_id = ?', [id]);
    res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};
