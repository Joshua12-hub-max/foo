import db from '../db/connection.js';
import { createNotification, notifyAdmins } from './notificationController.js';

export const applyUndertime = async (req, res) => {
  try {
    const { employeeId, date, reason } = req.body;
    
    const [result] = await db.query(
      "INSERT INTO undertime_requests (employee_id, date, reason) VALUES (?, ?, ?)",
      [employeeId, date, reason]
    );

    // Notify Admins
    await notifyAdmins({
      senderId: employeeId,
      title: "New Undertime Request",
      message: `Employee ${employeeId} requested undertime for ${date}.`,
      type: "undertime_request",
      referenceId: result.insertId
    });
    
    res.status(201).json({ message: "Undertime request submitted" });
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
    const approved_by = req.user ? (req.user.employee_id || req.user.id) : 'Admin';

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

    // Notify Employee
    await createNotification({
      recipientId: request.employee_id,
      senderId: approved_by,
      title: "Undertime Request Approved",
      message: `Your undertime request for ${request.date} has been approved.`,
      type: "undertime_approval",
      referenceId: id
    });

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
    const approved_by = req.user ? (req.user.employee_id || req.user.id) : 'Admin';

    await db.query(
      "UPDATE undertime_requests SET status = 'Rejected', rejection_reason = ?, approved_by = ? WHERE id = ?", 
      [reason, approved_by, id]
    );

    // Get employee ID (was missing in original code fetch, need to fetch it first or assume frontend passed it, but better to fetch)
    const [rows] = await db.query("SELECT employee_id, date FROM undertime_requests WHERE id = ?", [id]);
    if (rows.length > 0) {
       await createNotification({
         recipientId: rows[0].employee_id,
         senderId: approved_by,
         title: "Undertime Request Rejected",
         message: `Your undertime request for ${rows[0].date} was rejected. Reason: ${reason}`,
         type: "undertime_rejection",
         referenceId: id
       });
    }

    res.status(200).json({ message: "Undertime request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};
