import db from '../db/connection.js';

// --- Internal Helpers ---

export const createNotification = async ({ recipientId, senderId, title, message, type, referenceId }) => {
  try {
    await db.query(
      "INSERT INTO notifications (recipient_id, sender_id, title, message, type, reference_id) VALUES (?, ?, ?, ?, ?, ?)",
      [recipientId, senderId || null, title, message, type, referenceId || null]
    );
  } catch (err) {
    console.error("Failed to create notification:", err);
    // Don't throw, just log, so main flow isn't interrupted
  }
};

export const notifyAdmins = async ({ senderId, title, message, type, referenceId }) => {
  try {
    // Fetch all admins/hr
    const [admins] = await db.query("SELECT employee_id FROM authentication WHERE role IN ('admin', 'hr')");
    
    for (const admin of admins) {
      // Don't notify yourself if you are an admin submitting something
      if (admin.employee_id !== senderId) {
        await createNotification({
          recipientId: admin.employee_id,
          senderId,
          title,
          message,
          type,
          referenceId
        });
      }
    }
  } catch (err) {
    console.error("Failed to notify admins:", err);
  }
};

// --- Controller Methods ---

export const getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    // Use the ID from the authenticated user token
    const recipientId = req.user.employeeId || req.user.employee_id || req.user.id;

    const [notifications] = await db.query(
        "SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        [recipientId, limit, offset]
    );

    const [countResult] = await db.query(
        "SELECT COUNT(*) as unread_count FROM notifications WHERE recipient_id = ? AND status = 'unread'",
        [recipientId]
    );

    res.status(200).json({
        notifications,
        unread_count: countResult[0].unread_count
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const recipientId = req.user.employeeId || req.user.employee_id || req.user.id;
    
    // Using backticks for table name and ensuring clean query
    const sql = "SELECT COUNT(*) as unread_count FROM `notifications` WHERE `recipient_id` = ? AND `status` = 'unread'";
    
    const [result] = await db.query(sql, [recipientId]);
    
    res.status(200).json({ unread_count: result[0].unread_count });
  } catch (err) {
    console.error("Error in getUnreadCount:", err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const recipientId = req.user.employeeId || req.user.employee_id || req.user.id;
    
    // Ensure user owns the notification
    await db.query("UPDATE notifications SET status = 'read' WHERE notification_id = ? AND recipient_id = ?", [id, recipientId]);
    res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const recipientId = req.user.employeeId || req.user.employee_id || req.user.id;

    // Ensure user owns the notification
    await db.query("DELETE FROM notifications WHERE notification_id = ? AND recipient_id = ?", [id, recipientId]);
    res.status(200).json({ message: "Notification deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};
