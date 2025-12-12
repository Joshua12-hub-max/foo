import db from '../db/connection.js';
import { createNotification, notifyAdmins } from './notificationController.js';

export const applyUndertime = async (req, res) => {
  try {
    // Get employee ID from authenticated user (token uses employeeId camelCase)
    const employeeId = req.user?.employeeId || req.user?.employee_id;
    const { date, timeOut, reason } = req.body;
    
    // Get attachment path if file was uploaded
    const attachmentPath = req.file ? `undertime/${req.file.filename}` : null;
    
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID not found in token" });
    }
    
    if (!date || !reason) {
      return res.status(400).json({ message: "Date and reason are required" });
    }
    
    const [result] = await db.query(
      "INSERT INTO undertime_requests (employee_id, date, reason, attachment_path) VALUES (?, ?, ?, ?)",
      [employeeId, date, reason, attachmentPath]
    );

    // Get employee info for notification
    const [empRows] = await db.query(
      "SELECT first_name, last_name FROM authentication WHERE employee_id = ?",
      [employeeId]
    );
    const empName = empRows.length > 0 
      ? `${empRows[0].first_name} ${empRows[0].last_name}` 
      : employeeId;

    // Notify Employee of submission (pending)
    await createNotification({
      recipientId: employeeId,
      senderId: null,
      title: "Undertime Request Submitted",
      message: `Your undertime request for ${date} has been submitted and is pending review.`,
      type: "undertime_request_pending",
      referenceId: result.insertId
    });

    // Notify Admins of new request (pending)
    await notifyAdmins({
      senderId: employeeId,
      title: "New Undertime Request",
      message: `${empName} requested undertime for ${date}.`,
      type: "undertime_request",
      referenceId: result.insertId
    });
    
    res.status(201).json({ message: "Undertime request submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const getAllRequests = async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT ur.*, a.first_name, a.last_name, a.department 
      FROM undertime_requests ur
      LEFT JOIN authentication a ON ur.employee_id = a.employee_id
      ORDER BY ur.created_at DESC
    `);
    res.status(200).json({ requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const approveRequest = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const approved_by = req.user ? (req.user.employeeId || req.user.employee_id || req.user.id) : 'Admin';

    const [rows] = await connection.query("SELECT * FROM undertime_requests WHERE id = ?", [id]);
    if (rows.length === 0) throw new Error("Request not found");
    const request = rows[0];

    // 1. Update Request Status
    await connection.query(
      "UPDATE undertime_requests SET status = 'Approved', approved_by = ? WHERE id = ?", 
      [approved_by, id]
    );

    // 2. Update DTR Status to acknowledge the approved undertime
    // This marks the record as "excused" or "authorized"
    await connection.query(
      "UPDATE daily_time_records SET status = 'Authorized Undertime' WHERE employee_id = ? AND date = ?",
      [request.employee_id, request.date]
    );

    // Delete old pending notifications and create approved notifications
    try {
      await db.query(
        "DELETE FROM notifications WHERE reference_id = ? AND type IN ('undertime_request_pending', 'undertime_request')",
        [id]
      );

      // Notify Employee of approval
      await createNotification({
        recipientId: request.employee_id,
        senderId: approved_by,
        title: "Undertime Request Approved",
        message: `Your undertime request for ${request.date} has been approved.`,
        type: "undertime_request_approved",
        referenceId: id
      });

      // Update admin notifications to approved
      await notifyAdmins({
        senderId: request.employee_id,
        title: "Undertime Request Approved",
        message: `Undertime request for ${request.date} by ${request.employee_id} has been approved.`,
        type: "undertime_request_approved",
        referenceId: id
      });
    } catch (notifyErr) {
      console.error('Notification error:', notifyErr.message);
    }

    await connection.commit();
    res.status(200).json({ message: "Undertime request approved and DTR updated" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: err.message || "Something went wrong!" });
  } finally {
    connection.release();
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const approved_by = req.user ? (req.user.employeeId || req.user.employee_id || req.user.id) : 'Admin';

    await db.query(
      "UPDATE undertime_requests SET status = 'Rejected', rejection_reason = ?, approved_by = ? WHERE id = ?", 
      [reason, approved_by, id]
    );

    // Get employee ID
    const [rows] = await db.query("SELECT employee_id, date FROM undertime_requests WHERE id = ?", [id]);
    if (rows.length > 0) {
      // Delete old pending notifications and create rejected notifications
      try {
        await db.query(
          "DELETE FROM notifications WHERE reference_id = ? AND type IN ('undertime_request_pending', 'undertime_request')",
          [id]
        );

        await createNotification({
          recipientId: rows[0].employee_id,
          senderId: approved_by,
          title: "Undertime Request Rejected",
          message: `Your undertime request for ${rows[0].date} was rejected. Reason: ${reason}`,
          type: "undertime_request_rejected",
          referenceId: id
        });

        await notifyAdmins({
          senderId: rows[0].employee_id,
          title: "Undertime Request Rejected",
          message: `Undertime request for ${rows[0].date} by ${rows[0].employee_id} has been rejected.`,
          type: "undertime_request_rejected",
          referenceId: id
        });
      } catch (notifyErr) {
        console.error('Notification error:', notifyErr.message);
      }
    }

    res.status(200).json({ message: "Undertime request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

// Get current employee's undertime requests
export const getMyRequests = async (req, res) => {
  try {
    // Token uses employeeId (camelCase)
    const employeeId = req.user?.employeeId || req.user?.employee_id;
    
    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID not found in token" });
    }

    const [requests] = await db.query(`
      SELECT ur.*, a.first_name, a.last_name, a.department 
      FROM undertime_requests ur
      LEFT JOIN authentication a ON ur.employee_id = a.employee_id
      WHERE ur.employee_id = ?
      ORDER BY ur.created_at DESC
    `, [employeeId]);

    // Get employee info
    const [empInfo] = await db.query(
      "SELECT employee_id, first_name, last_name, department FROM authentication WHERE employee_id = ?",
      [employeeId]
    );

    res.status(200).json({ 
      requests,
      employee_info: empInfo[0] || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

// Cancel a pending undertime request (Employee only)
export const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    // Token uses employeeId (camelCase)
    const employeeId = req.user?.employeeId || req.user?.employee_id;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID not found in token" });
    }

    // Check if request exists and belongs to the employee
    const [rows] = await db.query(
      "SELECT * FROM undertime_requests WHERE id = ? AND employee_id = ?",
      [id, employeeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Request not found or unauthorized" });
    }

    const request = rows[0];

    // Only allow cancellation of pending requests
    if (request.status !== 'Pending') {
      return res.status(400).json({ 
        message: `Cannot cancel request with status: ${request.status}. Only pending requests can be cancelled.` 
      });
    }

    // Delete the pending request
    await db.query(
      "DELETE FROM undertime_requests WHERE id = ?",
      [id]
    );

    res.status(200).json({ message: "Undertime request cancelled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};
