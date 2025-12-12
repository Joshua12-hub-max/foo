import db from '../db/connection.js';

// --- Internal Helpers ---

export const createNotification = async ({ recipientId, senderId, title, message, type, referenceId }) => {
  try {
    console.log('🔔 Creating notification:', { recipientId, senderId, title, type });
    const [result] = await db.query(
      "INSERT INTO notifications (recipient_id, sender_id, title, message, type, reference_id) VALUES (?, ?, ?, ?, ?, ?)",
      [recipientId, senderId || null, title, message, type, referenceId || null]
    );
    console.log('🔔 Notification created successfully, insertId:', result.insertId);
  } catch (err) {
    console.error("Failed to create notification:", err);
    // Don't throw, just log, so main flow isn't interrupted
  }
};

export const notifyAdmins = async ({ senderId, title, message, type, referenceId, includeSender = false }) => {
  try {
    // Fetch all admins/hr
    const [admins] = await db.query("SELECT employee_id FROM authentication WHERE role IN ('admin', 'hr')");
    
    for (const admin of admins) {
      // Include sender if includeSender is true, otherwise skip sender
      if (includeSender || admin.employee_id !== senderId) {
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

// Notify ALL users (both employees and admins)
export const notifyAllUsers = async ({ senderId, title, message, type, referenceId }) => {
  try {
    // Fetch all users
    const [users] = await db.query("SELECT employee_id FROM authentication");
    console.log(`🔔 Notifying ${users.length} users about: ${title}`);
    
    for (const user of users) {
      await createNotification({
        recipientId: user.employee_id,
        senderId,
        title,
        message,
        type,
        referenceId
      });
    }
    console.log(`🔔 All ${users.length} users notified`);
  } catch (err) {
    console.error("Failed to notify all users:", err);
  }
};

// --- Controller Methods ---

export const getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    // Use the ID from the authenticated user token
    const recipientId = req.user.employeeId || req.user.employee_id || req.user.id;

    // Join with authentication to get sender name
    const [notifications] = await db.query(`
      SELECT 
        n.*,
        CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) AS sender_name,
        a.department AS sender_department
      FROM notifications n
      LEFT JOIN authentication a ON n.sender_id = a.employee_id
      WHERE n.recipient_id = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [recipientId, limit, offset]);

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

// Get notification history with filters (6 months limit)
export const getNotificationHistory = async (req, res) => {
  try {
    const user = req.user;
    const userRole = user.role;
    const userId = user.employeeId || user.employee_id || user.id;
    
    // Parse filters
    const { department, employeeId, startDate, endDate, limit = 100, offset = 0 } = req.query;
    
    // Calculate 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];
    
    let query = `
      SELECT 
        n.notification_id,
        n.recipient_id,
        n.sender_id,
        n.title,
        n.message,
        n.type,
        n.status,
        n.created_at,
        CONCAT(COALESCE(r.first_name, ''), ' ', COALESCE(r.last_name, '')) AS recipient_name,
        r.department AS recipient_department,
        CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, '')) AS sender_name
      FROM notifications n
      LEFT JOIN authentication r ON n.recipient_id = r.employee_id
      LEFT JOIN authentication s ON n.sender_id = s.employee_id
      WHERE n.created_at >= ?
    `;
    const params = [sixMonthsAgoStr];
    
    // Role-based filtering
    if (userRole !== 'admin' && userRole !== 'hr') {
      // Employees can only see their own notifications
      query += ' AND n.recipient_id = ?';
      params.push(userId);
    } else {
      // Admin filters
      if (department) {
        query += ' AND r.department = ?';
        params.push(department);
      }
      if (employeeId) {
        query += ' AND n.recipient_id = ?';
        params.push(employeeId);
      }
    }
    
    // Date range filters
    if (startDate) {
      query += ' AND DATE(n.created_at) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND DATE(n.created_at) <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [notifications] = await db.query(query, params);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      LEFT JOIN authentication r ON n.recipient_id = r.employee_id
      WHERE n.created_at >= ?
    `;
    const countParams = [sixMonthsAgoStr];
    
    if (userRole !== 'admin' && userRole !== 'hr') {
      countQuery += ' AND n.recipient_id = ?';
      countParams.push(userId);
    } else {
      if (department) {
        countQuery += ' AND r.department = ?';
        countParams.push(department);
      }
      if (employeeId) {
        countQuery += ' AND n.recipient_id = ?';
        countParams.push(employeeId);
      }
    }
    
    if (startDate) {
      countQuery += ' AND DATE(n.created_at) >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ' AND DATE(n.created_at) <= ?';
      countParams.push(endDate);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    
    res.status(200).json({
      notifications,
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Error fetching notification history:', err);
    res.status(500).json({ message: "Failed to fetch notification history" });
  }
};

// Export notifications as PDF data (returns JSON for frontend PDF generation)
export const exportNotificationsPDF = async (req, res) => {
  try {
    const user = req.user;
    const userRole = user.role;
    const userId = user.employeeId || user.employee_id || user.id;
    
    const { department, employeeId, startDate, endDate } = req.query;
    
    // Calculate 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];
    
    let query = `
      SELECT 
        n.notification_id,
        n.title,
        n.message,
        n.type,
        n.status,
        n.created_at,
        CONCAT(COALESCE(r.first_name, ''), ' ', COALESCE(r.last_name, '')) AS recipient_name,
        r.department AS recipient_department,
        CONCAT(COALESCE(s.first_name, ''), ' ', COALESCE(s.last_name, '')) AS sender_name
      FROM notifications n
      LEFT JOIN authentication r ON n.recipient_id = r.employee_id
      LEFT JOIN authentication s ON n.sender_id = s.employee_id
      WHERE n.created_at >= ?
    `;
    const params = [sixMonthsAgoStr];
    
    // Role-based filtering
    if (userRole !== 'admin' && userRole !== 'hr') {
      query += ' AND n.recipient_id = ?';
      params.push(userId);
    } else {
      if (department) {
        query += ' AND r.department = ?';
        params.push(department);
      }
      if (employeeId) {
        query += ' AND n.recipient_id = ?';
        params.push(employeeId);
      }
    }
    
    if (startDate) {
      query += ' AND DATE(n.created_at) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND DATE(n.created_at) <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY n.created_at DESC';
    
    const [notifications] = await db.query(query, params);
    
    res.status(200).json({
      success: true,
      notifications,
      exportDate: new Date().toISOString(),
      filters: { department, employeeId, startDate, endDate }
    });
  } catch (err) {
    console.error('Error exporting notifications:', err);
    res.status(500).json({ message: "Failed to export notifications" });
  }
};
