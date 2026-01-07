import db from '../db/connection.js';
import { createNotification, notifyAdmins } from './notificationController.js';

export const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, withPay, duration } = req.body;
    // Security: Force employeeId from the authenticated user token
    const employeeId = req.user.employeeId || req.user.employee_id || req.user.id;

    // Validate required fields
    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ 
        message: "Missing required fields. Please ensure all fields are filled." 
      });
    }

    // Enforce file upload
    if (!req.file) {
      return res.status(400).json({ 
        message: "Supporting document is required. Please upload a file." 
      });
    }

    // Check if employee has any leave credits (for paid leave)
    if (withPay === 'true' || withPay === true) {
      const [credits] = await db.query(
        "SELECT * FROM leave_credits WHERE employee_id = ? AND balance > 0",
        [employeeId]
      );
      
      if (credits.length === 0) {
        return res.status(400).json({ 
          message: "You have no leave credits available. Please contact HR to add credits or apply for unpaid leave." 
        });
      }

      // Check if specific leave type has credits
      const [typeCredits] = await db.query(
        "SELECT * FROM leave_credits WHERE employee_id = ? AND credit_type = ?",
        [employeeId, leaveType]
      );

      if (typeCredits.length > 0) {
        const leaveDuration = parseInt(duration) || 1;
        if (typeCredits[0].balance < leaveDuration) {
          return res.status(400).json({ 
            message: `Insufficient ${leaveType} credits. You have ${typeCredits[0].balance} days but requested ${leaveDuration} days.` 
          });
        }
      }
    }

    const attachmentPath = req.file ? `leaves/${req.file.filename}` : null;

    const [result] = await db.query(
      "INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, attachment_path, with_pay) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [employeeId, leaveType, startDate, endDate, reason, attachmentPath, withPay === 'true' || withPay === true]
    );

    // Notify Employee of submission (pending)
    try {
      await createNotification({
        recipientId: employeeId,
        senderId: null,
        title: "Leave Request Submitted",
        message: `Your ${leaveType} request from ${startDate} to ${endDate} has been submitted and is pending review.`,
        type: "leave_request_pending",
        referenceId: result.insertId
      });
    } catch (notifyError) {
      console.error('Failed to notify employee:', notifyError.message);
    }

    // Notify Admins of new request (pending)
    try {
      await notifyAdmins({
        senderId: employeeId,
        title: "New Leave Request",
        message: `Employee ${employeeId} requested ${leaveType} from ${startDate} to ${endDate}.`,
        type: "leave_request",
        referenceId: result.insertId
      });
    } catch (notifyError) {
      console.error('Failed to notify admins:', notifyError.message);
    }

    res.status(201).json({ message: "Leave application submitted successfully", id: result.insertId });
  } catch (err) {
    console.error('Apply Leave Error:', err.message);
    res.status(500).json({ message: err.message || "Something went wrong!" });
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const employee_id = req.user.employee_id || req.user.employeeId || req.user.id;
    
    const [leaves] = await db.query(`
      SELECT lr.*, a.department, a.first_name, a.last_name
      FROM leave_requests lr
      LEFT JOIN authentication a ON lr.employee_id = a.employee_id
      WHERE lr.employee_id = ?
      ORDER BY lr.created_at DESC
    `, [employee_id]);
    
    res.status(200).json({ leaves });
  } catch (err) {
    console.error('getMyLeaves error:', err);
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
    console.error('getAllLeaves error:', err.message);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

// New: Admin processes request (sends form)
export const processLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const adminFormPath = req.file ? `leaves/${req.file.filename}` : null;
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
    const finalPath = req.file ? `leaves/${req.file.filename}` : null;
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
  try {
    const { id } = req.params;
    const approved_by = req.user ? (req.user.employee_id || req.user.id) : 'Admin';

    // Get the leave request
    const [rows] = await db.query("SELECT * FROM leave_requests WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }
    const request = rows[0];

    // Calculate duration (number of days)
    const startDate = new Date(request.start_date);
    const endDate = new Date(request.end_date);
    const duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Deduct credits if it's a paid leave
    if (request.with_pay) {
      const creditType = request.leave_type;
      
      // Check current credits
      const [credits] = await db.query(
        "SELECT * FROM leave_credits WHERE employee_id = ? AND credit_type = ?",
        [request.employee_id, creditType]
      );

      if (credits.length > 0) {
        const currentBalance = credits[0].balance;
        const newBalance = Math.max(0, currentBalance - duration);
        
        // Update the credit balance
        await db.query(
          "UPDATE leave_credits SET balance = ?, updated_at = NOW() WHERE employee_id = ? AND credit_type = ?",
          [newBalance, request.employee_id, creditType]
        );
        
        console.log(`Deducted ${duration} days from ${creditType} credits for employee ${request.employee_id}. New balance: ${newBalance}`);
      }
    }

    // Update status to Approved
    await db.query(
      "UPDATE leave_requests SET status = 'Approved', approved_by = ?, updated_at = NOW() WHERE id = ?", 
      [approved_by, id]
    );

    // ===== AUTO-UPDATE DTR RECORDS FOR LEAVE PERIOD =====
    // Create or update daily_time_records for each day of the leave
    try {
      const currentDate = new Date(startDate);
      let daysUpdated = 0;
      
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Skip weekends (optional - can be removed if your org works weekends)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          // Insert or update the DTR record with status 'Leave'
          await db.query(`
            INSERT INTO daily_time_records (employee_id, date, time_in, time_out, late_minutes, undertime_minutes, status)
            VALUES (?, ?, NULL, NULL, 0, 0, 'Leave')
            ON DUPLICATE KEY UPDATE 
              time_in = NULL,
              time_out = NULL,
              late_minutes = 0,
              undertime_minutes = 0,
              status = 'Leave',
              updated_at = CURRENT_TIMESTAMP
          `, [request.employee_id, dateStr]);
          
          daysUpdated++;
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log(`✅ Auto-updated ${daysUpdated} DTR records to 'Leave' for employee ${request.employee_id} (${request.start_date} to ${request.end_date})`);
    } catch (dtrErr) {
      console.error('DTR Auto-Update Error:', dtrErr.message);
      // Don't fail the approval if DTR update fails - just log it
    }

    // Delete old pending notifications and create approved notifications
    try {
      // Delete ALL pending notifications for this request
      await db.query(
        "DELETE FROM notifications WHERE reference_id = ? AND type IN ('leave_request_pending', 'leave_request')",
        [id]
      );

      // Notify Employee of approval
      await createNotification({
        recipientId: request.employee_id,
        senderId: approved_by,
        title: "Leave Request Approved",
        message: `Your leave request for ${request.start_date} to ${request.end_date} has been approved. Your attendance records have been updated to 'Leave' for this period.${request.with_pay ? ` ${duration} day(s) have been deducted from your leave credits.` : ''}`,
        type: "leave_request_approved",
        referenceId: id
      });

      // Update admin notifications to approved
      await notifyAdmins({
        senderId: request.employee_id,
        title: "Leave Request Approved",
        message: `Leave request for ${request.start_date} to ${request.end_date} by ${request.employee_id} has been approved.`,
        type: "leave_request_approved",
        referenceId: id
      });
    } catch (notifyErr) {
      console.error('Notification failed:', notifyErr.message);
    }

    res.status(200).json({ message: "Leave approved successfully" });
  } catch (err) {
    console.error('Approve Leave Error:', err.message);
    res.status(500).json({ message: err.message || "Something went wrong!" });
  }
};

export const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const approved_by = req.user ? (req.user.employee_id || req.user.id) : 'Admin';
    
    await db.query("UPDATE leave_requests SET status = 'Rejected', rejection_reason = ?, approved_by = ? WHERE id = ?", [reason, approved_by, id]);

    // Get request details
    const [rows] = await db.query("SELECT employee_id, start_date, end_date FROM leave_requests WHERE id = ?", [id]);
    if (rows.length > 0) {
      const request = rows[0];
      
      // Delete old pending notifications and create rejected notifications
      try {
        await db.query(
          "DELETE FROM notifications WHERE reference_id = ? AND type IN ('leave_request_pending', 'leave_request')",
          [id]
        );

        await createNotification({
          recipientId: request.employee_id,
          senderId: approved_by,
          title: "Leave Request Rejected",
          message: `Your leave request for ${request.start_date} to ${request.end_date} has been rejected. Reason: ${reason}`,
          type: "leave_request_rejected",
          referenceId: id
        });

        await notifyAdmins({
          senderId: request.employee_id,
          title: "Leave Request Rejected",
          message: `Leave request for ${request.start_date} to ${request.end_date} by ${request.employee_id} has been rejected.`,
          type: "leave_request_rejected",
          referenceId: id
        });
      } catch (notifyErr) {
        console.error('Notification failed:', notifyErr.message);
      }
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
    const employeeId = req.user.employee_id || req.user.employeeId || req.user.id;
    console.log('📋 getMyCredits - employeeId from token:', employeeId);
    console.log('📋 getMyCredits - full req.user:', req.user);
    
    const [credits] = await db.query("SELECT * FROM leave_credits WHERE employee_id = ?", [employeeId]);
    console.log('📋 getMyCredits - credits found:', credits);
    
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

// ============ LEAVE CREDIT REQUESTS ============

// Employee applies for leave credit
export const applyForCredit = async (req, res) => {
  try {
    const employeeId = req.user.employee_id || req.user.employeeId || req.user.id;
    const { creditType, requestedAmount, reason } = req.body;

    if (!creditType || !requestedAmount || !reason) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const [result] = await db.query(`
      INSERT INTO leave_credit_requests (employee_id, credit_type, requested_amount, reason)
      VALUES (?, ?, ?, ?)
    `, [employeeId, creditType, requestedAmount, reason]);

    // Send confirmation notification to the employee
    try {
      await createNotification({
        recipientId: employeeId,
        senderId: null,
        title: "Credit Request Submitted",
        message: `Your request for ${requestedAmount} days of ${creditType} has been submitted and is pending review.`,
        type: "credit_request_pending",
        referenceId: result.insertId
      });
    } catch (notifyErr) {
      console.error('Employee notification failed:', notifyErr.message);
    }

    // Notify admins about new request
    try {
      await notifyAdmins({
        senderId: employeeId,
        title: "New Credit Request",
        message: `Employee ${employeeId} requested ${requestedAmount} days of ${creditType}.`,
        type: "credit_request",
        referenceId: result.insertId
      });
    } catch (notifyErr) {
      console.error('Admin notification failed:', notifyErr.message);
    }

    res.status(201).json({ message: "Credit request submitted successfully.", id: result.insertId });
  } catch (err) {
    console.error('Apply For Credit Error:', err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

// Employee gets their credit requests
export const getMyCreditRequests = async (req, res) => {
  try {
    const employeeId = req.user.employee_id || req.user.employeeId || req.user.id;

    const [requests] = await db.query(`
      SELECT lcr.*, a.first_name AS approved_first_name, a.last_name AS approved_last_name
      FROM leave_credit_requests lcr
      LEFT JOIN authentication a ON lcr.approved_by = a.employee_id
      WHERE lcr.employee_id = ?
      ORDER BY lcr.created_at DESC
    `, [employeeId]);

    res.status(200).json({ requests });
  } catch (err) {
    console.error('Get My Credit Requests Error:', err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

// Admin gets all credit requests
export const getAllCreditRequests = async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT lcr.*, 
             e.first_name, e.last_name, e.department,
             a.first_name AS approved_first_name, a.last_name AS approved_last_name
      FROM leave_credit_requests lcr
      LEFT JOIN authentication e ON lcr.employee_id = e.employee_id
      LEFT JOIN authentication a ON lcr.approved_by = a.employee_id
      ORDER BY lcr.created_at DESC
    `);

    res.status(200).json({ requests });
  } catch (err) {
    console.error('Get All Credit Requests Error:', err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

// Admin approves credit request
export const approveCreditRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const adminId = req.user.employee_id || req.user.id;

    const [requests] = await db.query("SELECT * FROM leave_credit_requests WHERE id = ?", [id]);
    if (requests.length === 0) {
      return res.status(404).json({ message: "Request not found." });
    }

    const request = requests[0];
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: "Request has already been processed." });
    }

    // Update request status
    await db.query(`
      UPDATE leave_credit_requests 
      SET status = 'Approved', admin_remarks = ?, approved_by = ?, updated_at = NOW()
      WHERE id = ?
    `, [remarks || 'Approved', adminId, id]);

    // Add credits to employee's balance
    await db.query(`
      INSERT INTO leave_credits (employee_id, credit_type, balance)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE balance = balance + ?
    `, [request.employee_id, request.credit_type, request.requested_amount, request.requested_amount]);

    // Update notifications - delete old pending, create approved for both employee and admin
    try {
      // Delete ALL pending notifications for this request (from both employee and admin)
      await db.query(
        "DELETE FROM notifications WHERE reference_id = ? AND type IN ('credit_request_pending', 'credit_request')",
        [id]
      );
      
      // Notify employee of approval
      await createNotification({
        recipientId: request.employee_id,
        senderId: adminId,
        title: "Credit Request Approved",
        message: `Your request for ${request.requested_amount} days of ${request.credit_type} has been approved.`,
        type: "credit_request_approved",
        referenceId: id
      });

      // Update admin notification to show approved
      await notifyAdmins({
        senderId: request.employee_id,
        title: "Credit Request Approved",
        message: `Request for ${request.requested_amount} days of ${request.credit_type} by ${request.employee_id} has been approved.`,
        type: "credit_request_approved",
        referenceId: id
      });
    } catch (notifyErr) {
      console.error('Approval notification failed:', notifyErr.message);
    }

    res.status(200).json({ message: "Credit request approved successfully." });
  } catch (err) {
    console.error('Approve Credit Request Error:', err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};

// Admin rejects credit request
export const rejectCreditRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;
    const adminId = req.user.employee_id || req.user.id;

    const [requests] = await db.query("SELECT * FROM leave_credit_requests WHERE id = ?", [id]);
    if (requests.length === 0) {
      return res.status(404).json({ message: "Request not found." });
    }

    const request = requests[0];
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: "Request has already been processed." });
    }

    await db.query(`
      UPDATE leave_credit_requests 
      SET status = 'Rejected', admin_remarks = ?, approved_by = ?, updated_at = NOW()
      WHERE id = ?
    `, [remarks || 'Rejected', adminId, id]);

    // Update notifications - delete old pending, create rejected for both employee and admin
    try {
      // Delete ALL pending notifications for this request (from both employee and admin)
      await db.query(
        "DELETE FROM notifications WHERE reference_id = ? AND type IN ('credit_request_pending', 'credit_request')",
        [id]
      );
      
      // Notify employee of rejection
      await createNotification({
        recipientId: request.employee_id,
        senderId: adminId,
        title: "Credit Request Rejected",
        message: `Your request for ${request.requested_amount} days of ${request.credit_type} has been rejected. Reason: ${remarks || 'No reason provided'}`,
        type: "credit_request_rejected",
        referenceId: id
      });

      // Update admin notification to show rejected
      await notifyAdmins({
        senderId: request.employee_id,
        title: "Credit Request Rejected",
        message: `Request for ${request.requested_amount} days of ${request.credit_type} by ${request.employee_id} has been rejected.`,
        type: "credit_request_rejected",
        referenceId: id
      });
    } catch (notifyErr) {
      console.error('Rejection notification failed:', notifyErr.message);
    }

    res.status(200).json({ message: "Credit request rejected." });
  } catch (err) {
    console.error('Reject Credit Request Error:', err);
    res.status(500).json({ message: "Something went wrong!" });
  }
};


