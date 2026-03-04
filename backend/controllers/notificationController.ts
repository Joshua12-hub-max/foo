import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { notifications, authentication } from '../db/schema.js';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import type { AuthenticatedRequest } from '../types/index.js';

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
    const [result] = await db.insert(notifications).values({
      recipientId,
      senderId: senderId || null,
      title,
      message,
      type,
      referenceId: referenceId || null,
      status: 'unread'
    });
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
    const admins = await db.select({ employeeId: authentication.employeeId })
      .from(authentication)
      .where(inArray(authentication.role, ['Admin', 'Human Resource', 'supervisor']));

    const notificationPromises = admins.map((admin) =>
      createNotification({
        recipientId: admin.employeeId,
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
    const users = await db.select({ employeeId: authentication.employeeId })
      .from(authentication);

    const notificationPromises = users.map((user) =>
      createNotification({
        recipientId: user.employeeId,
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

    const notifs = await db.select()
      .from(notifications)
      .where(eq(notifications.recipientId, String(employeeId)))
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.recipientId, String(employeeId)),
        eq(notifications.status, 'unread')
      ));

    res.status(200).json({
      success: true,
      notifications: notifs,
      unread_count: countResult.count
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

    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.recipientId, String(employeeId)),
        eq(notifications.status, 'unread')
      ));

    res.status(200).json({ success: true, unread_count: result.count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.update(notifications)
      .set({ status: 'read' })
      .where(eq(notifications.notificationId, Number(id)));
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.delete(notifications).where(eq(notifications.notificationId, Number(id)));
    res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};
