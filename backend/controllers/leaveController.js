import db from '../db/connection.js';
import { createNotification, notifyAdmins } from './notificationController.js';

export const applyLeave = async (req, res) => {
  try {
    // handled by uploadMiddleware, file is in req.file
    const { employeeId, leaveType, startDate, endDate, reason, withPay } = req.body;
    const attachmentPath = req.file ? req.file.filename : null; // Store filename or full path

    const [result] = await db.query(
      "INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, attachment_path, with_pay) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [employeeId, leaveType, startDate, endDate, reason, attachmentPath, withPay === 'true' || withPay === true]
    );

    // Notify Admins
    await notifyAdmins({
      senderId: employeeId,
      title: "New Leave Request",
      message: `Employee ${employeeId} requested ${leaveType} from ${startDate} to ${endDate}.`,
      type: "leave_request",
      referenceId: result.insertId
    });

    res.status(201).json({ message: "Leave application submitted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const employee_id = req.user.employee_id || req.user.id;
    const [leaves] = await db.query("SELECT * FROM leave_requests WHERE employee_id = ? ORDER BY created_at DESC", [employee_id]);
    res.status(200).json({ leaves });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const getAllLeaves = async (req, res) => {
  try {
    const [leaves] = await db.query(`
      SELECT lr.*, a.first_name, a.last_name, a.department
      FROM leave_requests lr
      LEFT JOIN authentication a ON lr.employee_id = a.employee_id
      ORDER BY lr.created_at DESC
    `);
    res.status(200).json({ leaves });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

// New: Admin processes request (sends form)
export const processLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const adminFormPath = req.file ? req.file.filename : null;
    const adminId = req.user ? (req.user.employee_id || req.user.id) : 'Admin';
    
    await db.query("UPDATE leave_requests SET status = 'Processing', admin_form_path = ? WHERE id = ?", [adminFormPath, id]);
    
    // Get employee ID
    const [rows] = await db.query("SELECT employee_id FROM leave_requests WHERE id = ?", [id]);
    if (rows.length > 0) {
       await createNotification({
         recipientId: rows[0].employee_id,
         senderId: adminId,
         title: "Leave Request Processed",
         message: "Your leave request is being processed. Please check for the admin form.",
         type: "leave_process",
         referenceId: id
       });
    }

    res.status(200).json({ message: "Leave processed, form sent to employee" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

// New: Employee finalizes request (uploads signed form)
export const finalizeLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const finalPath = req.file ? req.file.filename : null;
    const employeeId = req.user ? (req.user.employee_id || req.user.id) : null;
    
    await db.query("UPDATE leave_requests SET status = 'Finalizing', final_attachment_path = ? WHERE id = ?", [finalPath, id]);

    // Notify Admins
    await notifyAdmins({
      senderId: employeeId,
      title: "Leave Request Finalized",
      message: `Employee ${employeeId} has uploaded the signed leave form.`,
      type: "leave_finalize",
      referenceId: id
    });

    res.status(200).json({ message: "Final form submitted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const approveLeave = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const approved_by = req.user ? (req.user.employee_id || req.user.id) : 'Admin';

    const [rows] = await connection.query("SELECT * FROM leave_requests WHERE id = ?", [id]);
    if (rows.length === 0) throw new Error("Request not found");
    const request = rows[0];

    // 1. Update Status
    await connection.query("UPDATE leave_requests SET status = 'Approved', approved_by = ? WHERE id = ?", [approved_by, id]);

    // Calculate days
    const start = new Date(request.start_date);
    const end = new Date(request.end_date);
    let daysCount = 0;
    // Clone start for iteration so we don't mess up the next loop
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        daysCount++;
    }

    // 2. Deduct Credits if With Pay
    if (request.with_pay) {
        const [creditRows] = await connection.query(
            "SELECT balance FROM leave_credits WHERE employee_id = ? AND credit_type = ?",
            [request.employee_id, request.leave_type]
        );

        const currentBalance = creditRows.length > 0 ? parseFloat(creditRows[0].balance) : 0;

        if (currentBalance < daysCount) {
            throw new Error(`Insufficient ${request.leave_type} credits. Balance: ${currentBalance}, Requested: ${daysCount}`);
        }

        await connection.query(
            "UPDATE leave_credits SET balance = balance - ? WHERE employee_id = ? AND credit_type = ?",
            [daysCount, request.employee_id, request.leave_type]
        );
    }

    // 3. Update DTR (Mark days as 'Leave')
    // Reset loop variable
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        await connection.query(`
           INSERT INTO daily_time_records (employee_id, date, status)
           VALUES (?, ?, 'Leave')
           ON DUPLICATE KEY UPDATE status = 'Leave'
        `, [request.employee_id, dateStr]);
    }

    // Notify Employee
    await createNotification({
      recipientId: request.employee_id,
      senderId: approved_by,
      title: "Leave Request Approved",
      message: `Your leave request for ${request.start_date} to ${request.end_date} has been approved.`,
      type: "leave_approval",
      referenceId: id
    });

    await connection.commit();
    res.status(200).json({ message: "Leave approved and DTR updated" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: err.message || "Something went wrong!" });
  } finally {
    connection.release();
  }
};

export const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const approved_by = req.user ? (req.user.employee_id || req.user.id) : 'Admin';
    
    await db.query("UPDATE leave_requests SET status = 'Rejected', rejection_reason = ?, approved_by = ? WHERE id = ?", [reason, approved_by, id]);

    // Get employee ID
    const [rows] = await db.query("SELECT employee_id FROM leave_requests WHERE id = ?", [id]);
    if (rows.length > 0) {
       await createNotification({
         recipientId: rows[0].employee_id,
         senderId: approved_by,
         title: "Leave Request Rejected",
         message: `Your leave request has been rejected. Reason: ${reason}`,
         type: "leave_rejection",
         referenceId: id
       });
    }

    res.status(200).json({ message: "Leave rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

// New: Get credits for an employee (Admin view)
export const getEmployeeCredits = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const [credits] = await db.query("SELECT * FROM leave_credits WHERE employee_id = ?", [employeeId]);
        res.status(200).json({ credits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Something went wrong!" });
    }
};

export const getMyCredits = async (req, res) => {
  try {
    const employeeId = req.user.employee_id || req.user.id;
    const [credits] = await db.query("SELECT * FROM leave_credits WHERE employee_id = ?", [employeeId]);
    res.status(200).json({ credits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const getAllCredits = async (req, res) => {
  try {
    const [credits] = await db.query(`
      SELECT lc.*, a.first_name, a.last_name, a.department 
      FROM leave_credits lc
      JOIN authentication a ON lc.employee_id = a.employee_id
      ORDER BY a.last_name ASC
    `);
    res.status(200).json({ credits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const addOrUpdateCredit = async (req, res) => {
  try {
    const { employeeId, creditType, balance } = req.body;
    
    if (!employeeId || !creditType || balance === undefined) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    await db.query(`
      INSERT INTO leave_credits (employee_id, credit_type, balance)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE balance = ?
    `, [employeeId, creditType, balance, balance]);

    res.status(200).json({ message: "Leave credit updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};
