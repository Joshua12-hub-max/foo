import { Request, Response } from 'express';
import db from '../db/connection.js';
import { createNotification, notifyAdmins } from './notificationController.js';
import type { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';

interface LeaveRequestRow extends RowDataPacket {
  id: number;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  with_pay: boolean;
  attachment_path?: string;
  admin_form_path?: string;
  final_attachment_path?: string;
  rejection_reason?: string;
  approved_by?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
}

interface LeaveCreditRow extends RowDataPacket {
  id: number;
  employee_id: string;
  credit_type: string;
  balance: number;
  first_name?: string;
  last_name?: string;
  department?: string;
}

interface CreditRequestRow extends RowDataPacket {
  id: number;
  employee_id: string;
  credit_type: string;
  requested_amount: number;
  reason: string;
  status: string;
  admin_remarks?: string;
  approved_by?: string;
}

// CSC Leave Categories - Special leaves that DON'T deduct from VL/SL credits
const SPECIAL_LEAVES_NO_DEDUCTION = [
  'Special Privilege Leave',      // 3 days/year (SLP)
  'Special Emergency Leave',      // 5 days (calamity)
  'Wellness Leave',               // 5 days (2025/2026 CSC Memo)
  'Official Business',            // No credit deduction
  'Study Leave',                  // CSC-approved, separate allocation
  'VAWC Leave',                   // Violence Against Women and Children
  'Rehabilitation Leave',         // Separate allocation
  'Maternity Leave',              // 105/60 days, separate
  'Paternity Leave',              // 7 days, separate
  'Solo Parent Leave',            // 7 days, separate
  'Special Leave Benefits for Women' // 60 days (gynecological disorders)
];

// Cross-charging rules per CSC: SL can use VL, VL cannot use SL
const CROSS_CHARGE_MAP: Record<string, string | null> = {
  'Sick Leave': 'Vacation Leave',      // SL can fallback to VL
  'Vacation Leave': null,               // VL cannot use SL
  'Forced/Mandatory Leave': 'Vacation Leave' // Deducted from VL
};

// Map leave types to their credit type for deduction
const LEAVE_TO_CREDIT_MAP: Record<string, string | null> = {
  'Vacation Leave': 'Vacation Leave',
  'Sick Leave': 'Sick Leave',
  'Special Privilege Leave': 'Special Privilege Leave',
  'Special Emergency Leave': null,  // No deduction
  'Wellness Leave': null,            // No deduction
  'Official Business': null,         // No deduction
  'Forced/Mandatory Leave': 'Vacation Leave',
  'Maternity Leave': 'Maternity Leave',
  'Paternity Leave': 'Paternity Leave',
  'Solo Parent Leave': 'Solo Parent Leave'
};

const calculateWorkingDays = (startDate: string, endDate: string) => {
  let count = 0;
  let curDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sun(0) and Sat(6)
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
};

export const allocateDefaultCredits = async (employeeId: string) => {
  try {
    const defaults = [
      { type: 'Vacation Leave', balance: 15 },
      { type: 'Sick Leave', balance: 15 },
      { type: 'Special Privilege Leave', balance: 3 },
    ];

    for (const credit of defaults) {
      // Check if exists first to avoid duplicates
      const [existing] = await db.query<LeaveCreditRow[]>(
        'SELECT * FROM leave_credits WHERE employee_id = ? AND credit_type = ?',
        [employeeId, credit.type]
      );

      if (existing.length === 0) {
        await db.query(
          'INSERT INTO leave_credits (employee_id, credit_type, balance) VALUES (?, ?, ?)',
          [employeeId, credit.type, credit.balance]
        );
      }
    }
    console.log(`Allocated default credits for ${employeeId}`);
  } catch (error) {
    console.error(`Failed to allocate credits for ${employeeId}:`, error);
  }
};

// ============================================================================
// Leave Application
// ============================================================================

// ... imports
import { applyLeaveSchema, rejectLeaveSchema, creditUpdateSchema } from '../schemas/leaveSchema.js';

// ... existing code ...

export const applyLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    
    // Zod Validation
    const validation = applyLeaveSchema.safeParse(req.body);

    if (!validation.success) {
        res.status(400).json({ 
            message: 'Validation Error', 
            errors: validation.error.format() 
        });
        return;
    }

    const { leaveType, startDate, endDate, reason, withPay } = validation.data;
    const employeeId = authReq.user.employeeId || authReq.user.id;

    if (!employeeId) {
       res.status(400).json({ message: 'User not identified.' });
       return;
    }
    
    // ... rest of the function ...

    // SERVER-SIDE DURATION CALCULATION (Security & Automation)
    const calculatedDuration = calculateWorkingDays(startDate, endDate);
    
    if (calculatedDuration === 0) {
        res.status(400).json({ message: 'Leave duration is 0 working days. Please check your dates (Saturdays/Sundays are excluded).' });
        return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'Supporting document is required. Please upload a file.' });
      return;
    }

    // Determine if this is a special leave type (no credit deduction)
    const isSpecialLeave = SPECIAL_LEAVES_NO_DEDUCTION.includes(leaveType);
    
    // Determine the actual credit type to deduct from
    let actualCreditType = LEAVE_TO_CREDIT_MAP[leaveType] || leaveType;
    let crossChargedFrom: string | null = null;
    let finalWithPay = withPay;

    // CSC Leave Credit Logic
    if (finalWithPay && !isSpecialLeave) {
      // Check primary credit type first
      const [primaryCredits] = await db.query<LeaveCreditRow[]>(
        'SELECT * FROM leave_credits WHERE employee_id = ? AND credit_type = ?',
        [employeeId, actualCreditType]
      );

      const primaryBalance = primaryCredits.length > 0 ? primaryCredits[0].balance : 0;

      // If primary credits insufficient, check cross-charging
      if (primaryBalance < calculatedDuration) {
        const crossChargeType = CROSS_CHARGE_MAP[leaveType];
        
        if (crossChargeType) {
          // CSC Rule: SL can use VL credits when SL exhausted
          const [fallbackCredits] = await db.query<LeaveCreditRow[]>(
            'SELECT * FROM leave_credits WHERE employee_id = ? AND credit_type = ?',
            [employeeId, crossChargeType]
          );

          const fallbackBalance = fallbackCredits.length > 0 ? fallbackCredits[0].balance : 0;
          const totalAvailable = primaryBalance + fallbackBalance;

          if (totalAvailable >= calculatedDuration) {
            // Will use cross-charging
            crossChargedFrom = crossChargeType;
            actualCreditType = crossChargeType; // Will deduct from fallback
          } else {
            // Not enough credits even with cross-charging
            res.status(400).json({
              message: `Insufficient credits. You have ${primaryBalance} ${leaveType} credits and ${fallbackBalance} ${crossChargeType} credits (total: ${totalAvailable} days) but requested ${calculatedDuration} working days. Consider applying for Leave Without Pay (LWOP).`
            });
            return;
          }
        } else {
          // No cross-charging available for this leave type (e.g., VL cannot use SL)
          res.status(400).json({
            message: `Insufficient ${leaveType} credits. You have ${primaryBalance} days but requested ${calculatedDuration} working days. Note: ${leaveType} cannot be cross-charged from other leave types per CSC rules.`
          });
          return;
        }
      }
    }

    // CSC Rule: Cannot request LWOP if you still have credits for that leave type
    if (!finalWithPay && !isSpecialLeave) {
      const creditTypeToCheck = LEAVE_TO_CREDIT_MAP[leaveType] || leaveType;
      const [existingCredits] = await db.query<LeaveCreditRow[]>(
        'SELECT * FROM leave_credits WHERE employee_id = ? AND credit_type = ? AND balance > 0',
        [employeeId, creditTypeToCheck]
      );

      if (existingCredits.length > 0 && existingCredits[0].balance >= calculatedDuration) {
        res.status(400).json({
          message: `CSC Rule: You cannot request Leave Without Pay (LWOP) when you still have sufficient ${creditTypeToCheck} credits (${existingCredits[0].balance} days available). Please apply for paid leave first.`
        });
        return;
      }
    }

    const attachmentPath = req.file ? `leaves/${req.file.filename}` : null;

    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, attachment_path, with_pay) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [employeeId, leaveType, startDate, endDate, reason, attachmentPath, withPay]
    );

    try {
      await createNotification({
        recipientId: String(employeeId),
        senderId: null,
        title: 'Leave Request Submitted',
        message: `Your ${leaveType} request from ${startDate} to ${endDate} has been submitted.`,
        type: 'leave_request_pending',
        referenceId: result.insertId
      });

      await notifyAdmins({
        senderId: String(employeeId),
        title: 'New Leave Request',
        message: `Employee ${employeeId} requested ${leaveType} from ${startDate} to ${endDate}.`,
        type: 'leave_request',
        referenceId: result.insertId
      });
    } catch (notifyError) {
      console.error('Notification failed:', notifyError);
    }

    res.status(201).json({ message: 'Leave application submitted successfully', id: result.insertId });
  } catch (err) {
    const error = err as Error;
    console.error('Apply Leave Error:', error.message);
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};

export const getMyLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employee_id = authReq.user.employeeId || authReq.user.id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';
    const status = (req.query.status as string) || '';

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE lr.employee_id = ?';
    const queryParams: any[] = [employee_id];

    if (search) {
      whereClause += ' AND (lr.leave_type LIKE ? OR lr.reason LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    if (startDate) {
      whereClause += ' AND lr.start_date >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND lr.end_date <= ?';
      queryParams.push(endDate);
    }

    if (status) {
      whereClause += ' AND lr.status = ?';
      queryParams.push(status);
    }

    // Count Total
    const [countResult] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as total
      FROM leave_requests lr
      ${whereClause}
    `, queryParams);

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch Data
    const [leaves] = await db.query<LeaveRequestRow[]>(`
      SELECT lr.*, a.department, a.first_name, a.last_name
      FROM leave_requests lr
      LEFT JOIN authentication a ON lr.employee_id = a.employee_id
      ${whereClause}
      ORDER BY lr.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    res.status(200).json({
      leaves,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    });
  } catch (err) {
    console.error('getMyLeaves error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const getAllLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const department = (req.query.department as string) || '';
    const employeeId = (req.query.employeeId as string) || '';
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';

    const offset = (page - 1) * limit;

    // Base query parts
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    // Add search functionality
    if (search) {
      whereClause += `
        AND (
          lr.leave_type LIKE ? OR 
          a.first_name LIKE ? OR 
          a.last_name LIKE ? OR 
          lr.status LIKE ?
        )
      `;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Add structured filters
    if (department) {
      whereClause += ' AND a.department = ?';
      queryParams.push(department);
    }

    if (employeeId) {
      // Assuming passed as "First Last" name from frontend or ID. 
      // The frontend currently passes "First Last" as 'employee' filter based on the dropdown options.
      // But the table stores IDs. 
      // Let's check how the frontend sends it. 
      // The frontend uses "name" for filtering: result.filter(item => item.name === appliedFilters.employee);
      // Backend 'a.first_name' + ' ' + 'a.last_name' should match? 
      // Or we can filter by ID if frontend sends ID. 
      // The frontend options currently set names: setEmployeeOptions(names);
      
      // Let's allow partial match on name for now to support "First Last" string
      whereClause += ' AND CONCAT(a.first_name, " ", a.last_name) = ?';
      queryParams.push(employeeId);
    }

    if (startDate) {
      whereClause += ' AND lr.start_date >= ?';
      queryParams.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND lr.end_date <= ?';
      queryParams.push(endDate);
    }

    // Count Total Items
    const [countResult] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as total
      FROM leave_requests lr
      LEFT JOIN authentication a ON lr.employee_id = a.employee_id
      ${whereClause}
    `, queryParams);

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch Paginated Data
    const [leaves] = await db.query<LeaveRequestRow[]>(`
      SELECT 
        lr.*, 
        COALESCE(a.first_name, '') as first_name, 
        COALESCE(a.last_name, '') as last_name, 
        COALESCE(a.department, 'N/A') as department, 
        lc.balance as current_balance
      FROM leave_requests lr
      LEFT JOIN authentication a ON lr.employee_id = a.employee_id
      LEFT JOIN leave_credits lc ON lr.employee_id = lc.employee_id AND lr.leave_type = lc.credit_type
      ${whereClause}
      ORDER BY lr.created_at DESC
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    res.status(200).json({
      leaves,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    });

  } catch (err) {
    console.error('getAllLeaves error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const processLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const adminFormPath = req.file ? `leaves/${req.file.filename}` : null;
    const adminId = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Admin';

    await db.query("UPDATE leave_requests SET status = 'Processing', admin_form_path = ? WHERE id = ?", [adminFormPath, id]);

    const [rows] = await db.query<LeaveRequestRow[]>('SELECT employee_id FROM leave_requests WHERE id = ?', [id]);
    if (rows.length > 0) {
      await createNotification({
        recipientId: rows[0].employee_id,
        senderId: adminId,
        title: 'Leave Request Processed',
        message: 'Your leave request is being processed. Please check for the admin form.',
        type: 'leave_process',
        referenceId: parseInt(id)
      });
    }

    res.status(200).json({ message: 'Leave processed, form sent to employee' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const finalizeLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const finalPath = req.file ? `leaves/${req.file.filename}` : null;
    const employeeId = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : null;

    await db.query("UPDATE leave_requests SET status = 'Finalizing', final_attachment_path = ? WHERE id = ?", [finalPath, id]);

    await notifyAdmins({
      senderId: employeeId,
      title: 'Leave Request Finalized',
      message: `Employee ${employeeId} has uploaded the signed leave form.`,
      type: 'leave_finalize',
      referenceId: parseInt(id)
    });

    res.status(200).json({ message: 'Final form submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const approveLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const approved_by = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Admin';

    const [rows] = await db.query<LeaveRequestRow[]>('SELECT * FROM leave_requests WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }
    const request = rows[0];

    const startDate = new Date(request.start_date);
    const endDate = new Date(request.end_date);
    
    // Use working days calculation (excluding weekends) for consistency
    const duration = calculateWorkingDays(request.start_date, request.end_date);

    // Check if this is a special leave type (no credit deduction)
    const isSpecialLeave = SPECIAL_LEAVES_NO_DEDUCTION.includes(request.leave_type);

    // Credit deduction logic per CSC rules
    if (request.with_pay && !isSpecialLeave) {
      // Determine the credit type to deduct from
      const primaryCreditType = LEAVE_TO_CREDIT_MAP[request.leave_type] || request.leave_type;
      
      const [primaryCredits] = await db.query<LeaveCreditRow[]>(
        'SELECT * FROM leave_credits WHERE employee_id = ? AND credit_type = ?',
        [request.employee_id, primaryCreditType]
      );

      const primaryBalance = primaryCredits.length > 0 ? primaryCredits[0].balance : 0;
      let remainingToDeduct = duration;

      // First, deduct from primary credit type
      if (primaryBalance > 0) {
        const deductFromPrimary = Math.min(primaryBalance, remainingToDeduct);
        const newPrimaryBalance = primaryBalance - deductFromPrimary;
        
        await db.query(
          'UPDATE leave_credits SET balance = ?, updated_at = NOW() WHERE employee_id = ? AND credit_type = ?',
          [newPrimaryBalance, request.employee_id, primaryCreditType]
        );
        
        remainingToDeduct -= deductFromPrimary;
        console.log(`Deducted ${deductFromPrimary} days from ${primaryCreditType} for employee ${request.employee_id}`);
      }

      // If there's remaining to deduct, check cross-charging (CSC: SL can use VL)
      if (remainingToDeduct > 0) {
        const crossChargeType = CROSS_CHARGE_MAP[request.leave_type];
        
        if (crossChargeType) {
          const [fallbackCredits] = await db.query<LeaveCreditRow[]>(
            'SELECT * FROM leave_credits WHERE employee_id = ? AND credit_type = ?',
            [request.employee_id, crossChargeType]
          );

          if (fallbackCredits.length > 0 && fallbackCredits[0].balance > 0) {
            const deductFromFallback = Math.min(fallbackCredits[0].balance, remainingToDeduct);
            const newFallbackBalance = fallbackCredits[0].balance - deductFromFallback;
            
            await db.query(
              'UPDATE leave_credits SET balance = ?, updated_at = NOW() WHERE employee_id = ? AND credit_type = ?',
              [newFallbackBalance, request.employee_id, crossChargeType]
            );
            
            console.log(`Cross-charged ${deductFromFallback} days from ${crossChargeType} for employee ${request.employee_id} (${request.leave_type} exhausted)`);
          }
        }
      }
    } else if (isSpecialLeave) {
      console.log(`No credit deduction for special leave type: ${request.leave_type}`);
    }

    await db.query(
      "UPDATE leave_requests SET status = 'Approved', approved_by = ?, updated_at = NOW() WHERE id = ?",
      [approved_by, id]
    );

    // Update DTR records
    try {
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay();

        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          await db.query(`
            INSERT INTO daily_time_records (employee_id, date, time_in, time_out, late_minutes, undertime_minutes, status)
            VALUES (?, ?, NULL, NULL, 0, 0, 'Leave')
            ON DUPLICATE KEY UPDATE status = 'Leave', updated_at = CURRENT_TIMESTAMP
          `, [request.employee_id, dateStr]);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (dtrErr) {
      console.error('DTR Auto-Update Error:', dtrErr);
    }

    try {
      await db.query(
        "DELETE FROM notifications WHERE reference_id = ? AND type IN ('leave_request_pending', 'leave_request')",
        [id]
      );

      await createNotification({
        recipientId: request.employee_id,
        senderId: approved_by,
        title: 'Leave Request Approved',
        message: `Your leave request for ${request.start_date} to ${request.end_date} has been approved.`,
        type: 'leave_request_approved',
        referenceId: parseInt(id)
      });
    } catch (notifyErr) {
      console.error('Notification failed:', notifyErr);
    }

    res.status(200).json({ message: 'Leave approved successfully' });
  } catch (err) {
    const error = err as Error;
    console.error('Approve Leave Error:', error.message);
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};

export const rejectLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Zod Validation
    const validation = rejectLeaveSchema.safeParse(req.body);
    if (!validation.success) {
         res.status(400).json({ 
            message: 'Validation Error', 
            errors: validation.error.format() 
        });
        return;
    }
    const { reason } = validation.data;

    const authReq = req as AuthenticatedRequest;
    const approved_by = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Admin';

    await db.query(
      "UPDATE leave_requests SET status = 'Rejected', rejection_reason = ?, approved_by = ? WHERE id = ?",
      [reason, approved_by, id]
    );

    const [rows] = await db.query<LeaveRequestRow[]>('SELECT employee_id, start_date, end_date FROM leave_requests WHERE id = ?', [id]);
    if (rows.length > 0) {
      try {
        await db.query(
          "DELETE FROM notifications WHERE reference_id = ? AND type IN ('leave_request_pending', 'leave_request')",
          [id]
        );

        await createNotification({
          recipientId: rows[0].employee_id,
          senderId: approved_by,
          title: 'Leave Request Rejected',
          message: `Your leave request for ${rows[0].start_date} to ${rows[0].end_date} has been rejected. Reason: ${reason}`,
          type: 'leave_request_rejected',
          referenceId: parseInt(id)
        });
      } catch (notifyErr) {
        console.error('Notification failed:', notifyErr);
      }
    }

    res.status(200).json({ message: 'Leave rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

// ============================================================================
// Leave Credits
// ============================================================================

export const getEmployeeCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const [credits] = await db.query<LeaveCreditRow[]>(`
      SELECT 
        lc.*, 
        COALESCE(a.first_name, '') as first_name, 
        COALESCE(a.last_name, '') as last_name, 
        COALESCE(a.department, 'N/A') as department 
      FROM leave_credits lc
      LEFT JOIN authentication a ON lc.employee_id = a.employee_id
      WHERE lc.employee_id = ?
    `, [employeeId]);
    res.status(200).json({ credits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const getMyCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user.employeeId || authReq.user.id;
    const [credits] = await db.query<LeaveCreditRow[]>(`
      SELECT 
        lc.*, 
        COALESCE(a.first_name, '') as first_name, 
        COALESCE(a.last_name, '') as last_name, 
        COALESCE(a.department, 'N/A') as department 
      FROM leave_credits lc
      LEFT JOIN authentication a ON lc.employee_id = a.employee_id
      WHERE lc.employee_id = ?
    `, [employeeId]);
    res.status(200).json({ credits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const getAllEmployeeCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    if (search) {
      whereClause += `
        AND (
          a.first_name LIKE ? OR 
          a.last_name LIKE ? OR 
          lc.employee_id LIKE ?
        )
      `;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Count Total Items
    const [countResult] = await db.query<RowDataPacket[]>(`
      SELECT COUNT(*) as total
      FROM leave_credits lc
      LEFT JOIN authentication a ON lc.employee_id = a.employee_id
      ${whereClause}
    `, queryParams);

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch Paginated Data
    const [credits] = await db.query<LeaveCreditRow[]>(`
      SELECT 
        lc.*, 
        COALESCE(a.first_name, '') as first_name, 
        COALESCE(a.last_name, '') as last_name, 
        COALESCE(a.department, 'N/A') as department 
      FROM leave_credits lc
      LEFT JOIN authentication a ON lc.employee_id = a.employee_id
      ${whereClause}
      ORDER BY a.last_name, a.first_name, lc.credit_type
      LIMIT ? OFFSET ?
    `, [...queryParams, limit, offset]);

    res.status(200).json({ 
      credits,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    });
  } catch (err) {
    console.error('getAllEmployeeCredits error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const updateEmployeeCredit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    
    // Zod Validation
    const validation = creditUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ 
        message: 'Validation Error', 
        errors: validation.error.format() 
      });
      return;
    }

    const { creditType, balance } = validation.data;

    if (!employeeId) {
      res.status(400).json({ message: 'Employee ID is required.' });
      return;
    }

    // Check if credit record exists
    const [existing] = await db.query<LeaveCreditRow[]>(
      'SELECT * FROM leave_credits WHERE employee_id = ? AND credit_type = ?',
      [employeeId, creditType]
    );

    if (existing.length > 0) {
      // Update existing
      await db.query(
        'UPDATE leave_credits SET balance = ?, updated_at = NOW() WHERE employee_id = ? AND credit_type = ?',
        [balance, employeeId, creditType]
      );
    } else {
      // Insert new
      await db.query(
        'INSERT INTO leave_credits (employee_id, credit_type, balance) VALUES (?, ?, ?)',
        [employeeId, creditType, balance]
      );
    }

    res.status(200).json({ message: 'Leave credit updated successfully' });
  } catch (err) {
    const error = err as Error;
    console.error('updateEmployeeCredit error:', error.message);
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};

export const deleteEmployeeCredit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const creditType = req.query.creditType as string;

    if (!employeeId || !creditType) {
      res.status(400).json({ message: 'Employee ID and Credit Type are required.' });
      return;
    }

    await db.query(
      'DELETE FROM leave_credits WHERE employee_id = ? AND credit_type = ?',
      [employeeId, creditType]
    );

    res.status(200).json({ message: 'Leave credit deleted successfully' });
  } catch (err) {
    const error = err as Error;
    console.error('deleteEmployeeCredit error:', error.message);
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};



