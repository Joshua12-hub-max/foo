import db from '../db/connection.js';

// Internal helper to create a notification
export const createNotification = async ({ recipientId, senderId, title, message, type, referenceId }) => {
  try {
    const [result] = await db.query(
      "INSERT INTO notifications (recipient_id, sender_id, title, message, type, reference_id, status) VALUES (?, ?, ?, ?, ?, ?, 'unread')",
      [recipientId, senderId || null, title, message, type, referenceId || null]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error in createNotification:', error);
    throw error;
  }
};

// Helper to notify all admins
export const notifyAdmins = async ({ senderId, title, message, type, referenceId }) => {
  try {
    const [admins] = await db.query(
      "SELECT employee_id FROM authentication WHERE role IN ('admin', 'hr', 'supervisor')"
    );
    
    const notificationPromises = admins.map(admin => 
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

// Helper to notify all users
export const notifyAllUsers = async ({ senderId, title, message, type, referenceId }) => {
  try {
    const [users] = await db.query("SELECT employee_id FROM authentication");
    
    const notificationPromises = users.map(user => 
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

// API: Get notifications for the current user
export const getNotifications = async (req, res) => {
  try {
    const employeeId = req.user.employeeId || req.user.employee_id || req.user.id;
    
    // Get notifications
    const [notifications] = await db.query(
      "SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC LIMIT 50",
      [employeeId]
    );
    
    // Get unread count
    const [countResult] = await db.query(
      "SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND status = 'unread'",
      [employeeId]
    );
    
    res.status(200).json({
      success: true,
      notifications: notifications,
      unread_count: countResult[0].count
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// API: Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const employeeId = req.user.employeeId || req.user.employee_id || req.user.id;
    const [result] = await db.query(
      "SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND status = 'unread'",
      [employeeId]
    );
    res.status(200).json({ success: true, unread_count: result[0].count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
};

// API: Mark as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      "UPDATE notifications SET status = 'read' WHERE notification_id = ?",
      [id]
    );
    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
};

// API: Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(
      "DELETE FROM notifications WHERE notification_id = ?",
      [id]
    );
    res.status(200).json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};
