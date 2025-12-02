import db from '../db/connection.js';
import { createNotification, notifyAdmins } from './notificationController.js';

export const createCorrection = async (req, res) => {
  try {
    // req.user from authMiddleware
    const employee_id = req.user.employee_id || req.user.id;
    const { date_time, in_time, out_time, corrected_time_in, corrected_time_out, reason } = req.body;

    // Basic validation
    if (!date_time || !reason) {
        return res.status(400).json({ message: "Date and Reason are required." });
    }

    const [result] = await db.query(
      `INSERT INTO dtr_corrections 
      (employee_id, date_time, original_time_in, original_time_out, corrected_time_in, corrected_time_out, reason, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [employee_id, date_time, in_time || null, out_time || null, corrected_time_in || null, corrected_time_out || null, reason]
    );

    // Notify Admins
    await notifyAdmins({
      senderId: employee_id,
      title: "DTR Correction Request",
      message: `Employee ${employee_id} requested DTR correction for ${date_time}.`,
      type: "dtr_correction",
      referenceId: result.insertId
    });

    res.status(201).json({ message: "Correction request submitted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const getMyCorrections = async (req, res) => {
  try {
    // req.user is populated by authMiddleware
    const employee_id = req.user.employee_id || req.user.id; 
    const [corrections] = await db.query("SELECT * FROM dtr_corrections WHERE employee_id = ? ORDER BY created_at DESC", [employee_id]);
    res.status(200).json({ corrections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const getAllCorrections = async (req, res) => {
  try {
    // Join with employee details if possible, but for now just the raw table
    // Assuming there is an employees table or authentication table to get names
    const [corrections] = await db.query(`
      SELECT dc.*, a.first_name, a.last_name 
      FROM dtr_corrections dc 
      LEFT JOIN authentication a ON dc.employee_id = a.employee_id 
      ORDER BY dc.created_at DESC
    `);
    res.status(200).json({ corrections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const approveCorrection = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    // specific logic: "approved_by" logic if you have admin info in req.user
    const approved_by = req.user ? (req.user.employee_id || req.user.id) : 'Admin'; 

    // 1. Get the correction details
    const [rows] = await connection.query("SELECT * FROM dtr_corrections WHERE id = ?", [id]);
    if (rows.length === 0) {
      throw new Error("Correction request not found");
    }
    const correction = rows[0];

    // 2. Update status
    await connection.query(
      "UPDATE dtr_corrections SET status = 'Approved', approved_by = ? WHERE id = ?", 
      [approved_by, id]
    );

    // 3. Update Daily Time Record (Upsert)
    // Ensure we use the corrected times. 
    await connection.query(`
      INSERT INTO daily_time_records (employee_id, date, time_in, time_out, status)
      VALUES (?, ?, ?, ?, 'Present')
      ON DUPLICATE KEY UPDATE 
        time_in = VALUES(time_in),
        time_out = VALUES(time_out),
        status = 'Present' -- Ensure status is Present if they corrected it
    `, [correction.employee_id, correction.date_time, correction.corrected_time_in, correction.corrected_time_out]);

    // Notify Employee
    await createNotification({
      recipientId: correction.employee_id,
      senderId: approved_by,
      title: "DTR Correction Approved",
      message: `Your DTR correction for ${correction.date_time} has been approved.`,
      type: "dtr_approval",
      referenceId: id
    });

    await connection.commit();
    res.status(200).json({ message: "Correction approved and DTR updated successfully" });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: err.message || "Something went wrong!" });
  } finally {
    connection.release();
  }
};

export const rejectCorrection = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Rejection reason
    const approved_by = req.user ? (req.user.employee_id || req.user.id) : 'Admin';

    await db.query(
      "UPDATE dtr_corrections SET status = 'Rejected', rejection_reason = ?, approved_by = ? WHERE id = ?", 
      [reason, approved_by, id]
    );

    // Get employee ID
    const [rows] = await db.query("SELECT employee_id, date_time FROM dtr_corrections WHERE id = ?", [id]);
    if (rows.length > 0) {
       await createNotification({
         recipientId: rows[0].employee_id,
         senderId: approved_by,
         title: "DTR Correction Rejected",
         message: `Your DTR correction for ${rows[0].date_time} was rejected. Reason: ${reason}`,
         type: "dtr_rejection",
         referenceId: id
       });
    }

    res.status(200).json({ message: "Correction rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

export const updateCorrectionByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // 1. Fetch current record to check status
    const [rows] = await db.query("SELECT status FROM dtr_corrections WHERE id = ?", [id]);
    if (rows.length === 0) {
        return res.status(404).json({ message: "Correction request not found." });
    }

    const currentStatus = rows[0].status;

    if (currentStatus !== 'Pending') {
        return res.status(400).json({ message: `Cannot update a request that is already ${currentStatus}.` });
    }

    // 2. Update (excluding status change)
    const { corrected_time_in, corrected_time_out, reason } = data; 
    
    await db.query(
      "UPDATE dtr_corrections SET corrected_time_in = ?, corrected_time_out = ?, reason = ? WHERE id = ?", 
      [corrected_time_in, corrected_time_out, reason, id]
    );
    res.status(200).json({ message: "Correction updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};
