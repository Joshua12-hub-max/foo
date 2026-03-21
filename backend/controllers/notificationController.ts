import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { notifications, authentication } from '../db/schema.js';
import { eq, and, desc, sql, inArray, ne } from 'drizzle-orm';
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
};

/**
 * Update notifications by type and reference ID (internal helper)
 */
export const updateNotificationsByReference = async ({
  type,
  referenceId,
  title,
  message,
  newType
}: {
  type: string | string[];
  referenceId: number;
  title: string;
  message: string;
  newType?: string;
}): Promise<void> => {
  const types = Array.isArray(type) ? type : [type];
  const updateData: Partial<typeof notifications.$inferInsert> = {
    title,
    message,
    status: 'unread'
  };
  
  if (newType) {
    updateData.type = newType;
  }

  const [result] = await db.update(notifications)
    .set(updateData)
    .where(and(
      inArray(notifications.type, types),
      eq(notifications.referenceId, referenceId)
    ));

  if (result.affectedRows === 0) {
    console.warn(`[NOTIF] No notifications found to update for referenceId: ${referenceId}, types: ${JSON.stringify(types)}`);
  } else {
    console.log(`[NOTIF] Updated ${result.affectedRows} notifications for referenceId: ${referenceId}`);
  }
};

/**
 * Notify all admins/hr
 */
export const notifyAdmins = async ({
  senderId,
  title,
  message,
  type,
  referenceId,
  excludeId
}: Omit<CreateNotificationParams, 'recipientId'> & { excludeId?: string }): Promise<void> => {
  try {
    const admins = await db.select({ employeeId: authentication.employeeId })
      .from(authentication)
      .where(and(
        inArray(authentication.role, ['Administrator', 'Human Resource']),
        excludeId ? ne(authentication.employeeId, excludeId) : undefined
      ));

    const notificationPromises = admins.map((admin) =>
      createNotification({
        recipientId: admin.employeeId || '',
        senderId,
        title,
        message,
        type,
        referenceId
      })
    );

    await Promise.all(notificationPromises);
  } catch (_error) {
      /* empty */

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
  referenceId,
  excludeId
}: Omit<CreateNotificationParams, 'recipientId'> & { excludeId?: string }): Promise<void> => {
  try {
    const users = await db.select({ employeeId: authentication.employeeId })
      .from(authentication)
      .where(excludeId ? ne(authentication.employeeId, excludeId) : undefined);

    const notificationPromises = users.map((user) =>
      createNotification({
        recipientId: user.employeeId || '',
        senderId,
        title,
        message,
        type,
        referenceId
      })
    );

    await Promise.all(notificationPromises);
  } catch (_error) {
      /* empty */

  }
};

/**
 * Notify all users in a specific department
 */
export const notifyDepartment = async ({
  departmentId,
  senderId,
  title,
  message,
  type,
  referenceId,
  excludeId
}: Omit<CreateNotificationParams, 'recipientId'> & { departmentId: number; excludeId?: string }): Promise<void> => {
  try {
    const users = await db.select({ employeeId: authentication.employeeId })
      .from(authentication)
      .where(and(
        eq(authentication.departmentId, departmentId),
        excludeId ? ne(authentication.employeeId, excludeId) : undefined
      ));

    const notificationPromises = users.map((user) =>
      createNotification({
        recipientId: user.employeeId || '',
        senderId,
        title,
        message,
        type,
        referenceId
      })
    );

    await Promise.all(notificationPromises);
  } catch (_error) {
    /* empty */
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
      unreadCount: countResult.count
    });
    } catch (_error) {

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

    res.status(200).json({ success: true, unreadCount: result.count });

  } catch (_error) {

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
  } catch (_error) {

    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await db.delete(notifications).where(eq(notifications.notificationId, Number(id)));
    res.status(200).json({ message: 'Notification deleted' });
  } catch (_error) {

    res.status(500).json({ message: 'Failed to delete notification' });
  }
};


