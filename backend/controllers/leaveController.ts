/**
 * CSC-Compliant Leave Controller
 * Based on CSC Omnibus Rules on Leave (Rule XVI)
 * 
 * Key Features:
 * - Monthly credit accrual (1.250 VL + 1.250 SL)
 * - Working days calculation (excludes weekends + holidays)
 * - Cross-charging (SL can use VL, VL cannot use SL)
 * - LWOP logic with payroll deduction formula
 * - Forced Leave enforcement
 * - Monetization with minimum balance requirement
 */

import { Request, Response } from 'express';
import db from '../db/connection.js';
import { createNotification, notifyAdmins } from './notificationController.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { AuthenticatedRequest } from '../types/index.js';
import {
  type LeaveType,
  type CreditType,
  type ApplicationStatus,
  type PaymentStatus,
  type TransactionType,
  type LeaveBalanceRow,
  type LeaveLedgerRow,
  type LeaveApplicationRow,
  type HolidayRow,
  type LWOPSummaryRow,
  MONTHLY_VL_ACCRUAL,
  MONTHLY_SL_ACCRUAL,
  SPL_ANNUAL,
  FORCED_LEAVE_ANNUAL,
  WORKING_DAYS_PER_MONTH,
  SPECIAL_LEAVES_NO_DEDUCTION,
  CROSS_CHARGE_MAP,
  LEAVE_TO_CREDIT_MAP,
  VL_ADVANCE_FILING_DAYS,
  SL_MEDICAL_CERT_THRESHOLD,
} from '../types/leave.types.js';
import {
  applyLeaveSchema,
  rejectLeaveSchema,
  creditUpdateSchema,
  creditAdjustmentSchema,
  accrueCreditsSchema,
  monetizationRequestSchema,
  validateVLAdvanceFiling,
  requiresMedicalCertificate,
} from '../schemas/leaveSchema.js';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get holidays for a date range
 */
const getHolidaysInRange = async (startDate: string, endDate: string): Promise<string[]> => {
  try {
    const [rows] = await db.query<HolidayRow[]>(
      `SELECT DATE_FORMAT(date, '%Y-%m-%d') as date FROM holidays 
       WHERE date BETWEEN ? AND ? AND type != 'Special Working'`,
      [startDate, endDate]
    );
    return rows.map(r => r.date);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return [];
  }
};

/**
 * Calculate working days between two dates
 * Excludes weekends (Sat/Sun) and holidays
 */
const calculateWorkingDays = async (startDate: string, endDate: string): Promise<number> => {
  const holidays = await getHolidaysInRange(startDate, endDate);
  const holidaySet = new Set(holidays);

  let count = 0;
  const curDate = new Date(startDate);
  const end = new Date(endDate);

  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    const dateStr = curDate.toISOString().split('T')[0];

    // Exclude weekends (0 = Sunday, 6 = Saturday) and holidays
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }

  return count;
};

/**
 * Get current year
 */
const getCurrentYear = (): number => new Date().getFullYear();

/**
 * Get employee's current credit balance
 */
const getEmployeeBalance = async (
  employeeId: string,
  creditType: CreditType,
  year?: number
): Promise<number> => {
  try {
    const targetYear = year || getCurrentYear();
    const [rows] = await db.query<LeaveBalanceRow[]>(
      `SELECT balance FROM leave_balances 
       WHERE employee_id = ? AND credit_type = ? AND year = ?`,
      [employeeId, creditType, targetYear]
    );
    return rows.length > 0 ? Number(rows[0].balance) : 0;
  } catch (error) {
    console.error('Error getting balance:', error);
    return 0;
  }
};

/**
 * Update employee balance and create ledger entry
 */
const updateBalance = async (
  employeeId: string,
  creditType: CreditType,
  amount: number,
  transactionType: TransactionType,
  referenceId?: number,
  referenceType?: 'leave_application' | 'monetization' | 'dtr' | 'manual',
  remarks?: string,
  createdBy?: string
): Promise<{ success: boolean; newBalance: number }> => {
  const year = getCurrentYear();

  try {
    // Get current balance
    const currentBalance = await getEmployeeBalance(employeeId, creditType, year);
    const newBalance = Number((currentBalance + amount).toFixed(3));

    // Update or insert balance
    await db.query(
      `INSERT INTO leave_balances (employee_id, credit_type, balance, year)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE balance = ?, updated_at = CURRENT_TIMESTAMP`,
      [employeeId, creditType, newBalance, year, newBalance]
    );

    // Create ledger entry
    await db.query(
      `INSERT INTO leave_ledger 
       (employee_id, credit_type, transaction_type, amount, balance_after, reference_id, reference_type, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employeeId, creditType, transactionType, amount, newBalance, referenceId, referenceType, remarks, createdBy]
    );

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error updating balance:', error);
    return { success: false, newBalance: 0 };
  }
};

/**
 * Update LWOP summary for service record tracking
 */
const updateLWOPSummary = async (employeeId: string, lwopDays: number): Promise<void> => {
  const year = getCurrentYear();

  try {
    // Get cumulative from previous years
    const [prevRows] = await db.query<LWOPSummaryRow[]>(
      `SELECT cumulative_lwop_days FROM lwop_summary 
       WHERE employee_id = ? AND year < ?
       ORDER BY year DESC LIMIT 1`,
      [employeeId, year]
    );

    const prevCumulative = prevRows.length > 0 ? Number(prevRows[0].cumulative_lwop_days) : 0;

    await db.query(
      `INSERT INTO lwop_summary (employee_id, year, total_lwop_days, cumulative_lwop_days)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         total_lwop_days = total_lwop_days + ?,
         cumulative_lwop_days = cumulative_lwop_days + ?,
         updated_at = CURRENT_TIMESTAMP`,
      [employeeId, year, lwopDays, prevCumulative + lwopDays, lwopDays, lwopDays]
    );
  } catch (error) {
    console.error('Error updating LWOP summary:', error);
  }
};

/**
 * Log event to Service Record (career history tracking)
 * Used for: Approved leaves, LWOP, promotions, etc.
 */
const logToServiceRecord = async (
  employeeId: string,
  eventType: 'Appointment' | 'Promotion' | 'Leave' | 'LWOP' | 'Return from Leave' | 'Transfer' | 'Suspension' | 'Resignation' | 'Retirement' | 'Other',
  eventDate: string,
  endDate: string | null,
  leaveType: string | null,
  daysCount: number,
  isWithPay: boolean,
  remarks: string,
  referenceId: number | null,
  referenceType: string | null,
  processedBy: string
): Promise<void> => {
  try {
    await db.query(
      `INSERT INTO service_records 
       (employee_id, event_type, event_date, end_date, leave_type, days_count, is_with_pay, remarks, reference_id, reference_type, processed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employeeId, eventType, eventDate, endDate, leaveType, daysCount, isWithPay, remarks, referenceId, referenceType, processedBy]
    );
    console.log(`✅ Logged ${eventType} to service record for ${employeeId}`);
  } catch (error) {
    console.error('Error logging to service record:', error);
  }
};

/**
 * Calculate tardiness and convert to VL deduction or LWOP
 * Formula: (Total Minutes Late/Undertime) / 480 = Decimal Days
 * 480 minutes = 8 hours = 1 working day
 */
const calculateTardinessDeduction = async (
  employeeId: string,
  year: number,
  month: number
): Promise<{ daysEquivalent: number; deductedFromVL: number; chargedAsLWOP: number }> => {
  try {
    // Get tardiness summary for the month
    const [tardiness] = await db.query<RowDataPacket[]>(
      `SELECT total_late_minutes, total_undertime_minutes 
       FROM tardiness_summary 
       WHERE employee_id = ? AND year = ? AND month = ?`,
      [employeeId, year, month]
    );

    if (tardiness.length === 0) {
      return { daysEquivalent: 0, deductedFromVL: 0, chargedAsLWOP: 0 };
    }

    const row = tardiness[0];
    const totalMinutes = (row.total_late_minutes || 0) + (row.total_undertime_minutes || 0);
    const daysEquivalent = totalMinutes / 480; // 480 mins = 8 hours = 1 day

    if (daysEquivalent <= 0) {
      return { daysEquivalent: 0, deductedFromVL: 0, chargedAsLWOP: 0 };
    }

    // Get VL balance
    const vlBalance = await getEmployeeBalance(employeeId, 'Vacation Leave', year);
    
    let deductedFromVL = 0;
    let chargedAsLWOP = 0;

    if (vlBalance >= daysEquivalent) {
      // Enough VL - deduct fully
      deductedFromVL = daysEquivalent;
      await updateBalance(
        employeeId,
        'Vacation Leave',
        -daysEquivalent,
        'TARDINESS_DEDUCTION',
        undefined,
        'dtr',
        `Tardiness/Undertime deduction for ${month}/${year} (${totalMinutes} mins = ${daysEquivalent.toFixed(3)} days)`,
        'SYSTEM'
      );
    } else if (vlBalance > 0) {
      // Partial VL, rest is LWOP
      deductedFromVL = vlBalance;
      chargedAsLWOP = daysEquivalent - vlBalance;
      
      await updateBalance(
        employeeId,
        'Vacation Leave',
        -vlBalance,
        'TARDINESS_DEDUCTION',
        undefined,
        'dtr',
        `Tardiness/Undertime deduction for ${month}/${year} (partial)`,
        'SYSTEM'
      );
      
      // Record LWOP
      await updateLWOPSummary(employeeId, chargedAsLWOP);
    } else {
      // No VL - all LWOP
      chargedAsLWOP = daysEquivalent;
      await updateLWOPSummary(employeeId, chargedAsLWOP);
    }

    // Update tardiness_summary with results
    await db.query(
      `UPDATE tardiness_summary 
       SET deducted_from_vl = ?, charged_as_lwop = ?, processed_at = CURRENT_TIMESTAMP, processed_by = 'SYSTEM'
       WHERE employee_id = ? AND year = ? AND month = ?`,
      [deductedFromVL, chargedAsLWOP, employeeId, year, month]
    );

    return { daysEquivalent, deductedFromVL, chargedAsLWOP };
  } catch (error) {
    console.error('Error calculating tardiness deduction:', error);
    return { daysEquivalent: 0, deductedFromVL: 0, chargedAsLWOP: 0 };
  }
};

// ============================================================================
// Leave Application Functions
// ============================================================================

/**
 * Apply for leave
 */
export const applyLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user.employeeId || authReq.user.id;

    if (!employeeId) {
      res.status(400).json({ message: 'User not identified.' });
      return;
    }

    // Validate input
    const validation = applyLeaveSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: 'Validation Error',
        errors: validation.error.format(),
      });
      return;
    }

    const { leaveType, startDate, endDate, reason, isWithPay } = validation.data;

    // Calculate working days
    const workingDays = await calculateWorkingDays(startDate, endDate);
    if (workingDays === 0) {
      res.status(400).json({
        message: 'Leave duration is 0 working days. Please check your dates (weekends and holidays are excluded).',
      });
      return;
    }

    // Validate VL advance filing (5 days before)
    if (leaveType === 'Vacation Leave' && !validateVLAdvanceFiling(startDate)) {
      res.status(400).json({
        message: `Vacation Leave must be filed at least ${VL_ADVANCE_FILING_DAYS} days in advance per CSC rules.`,
      });
      return;
    }

    // Check SL medical certificate requirement
    const needsMedCert = leaveType === 'Sick Leave' && requiresMedicalCertificate(workingDays);

    // Validate attachment
    if (!req.file) {
      res.status(400).json({ message: 'Supporting document is required. Please upload a file.' });
      return;
    }

    // Determine payment status
    const isSpecialLeave = SPECIAL_LEAVES_NO_DEDUCTION.includes(leaveType);
    let actualPaymentStatus: PaymentStatus = 'WITH_PAY';
    let daysWithPay = 0;
    let daysWithoutPay = 0;
    let crossChargedFrom: CreditType | null = null;

    if (isWithPay && !isSpecialLeave) {
      // Get credit type to deduct from
      const primaryCreditType = LEAVE_TO_CREDIT_MAP[leaveType] as CreditType || leaveType as CreditType;
      const primaryBalance = await getEmployeeBalance(String(employeeId), primaryCreditType);

      if (primaryBalance >= workingDays) {
        // Sufficient primary credits
        daysWithPay = workingDays;
        actualPaymentStatus = 'WITH_PAY';
      } else if (primaryBalance > 0) {
        // Partial credits available
        daysWithPay = primaryBalance;

        // Check cross-charging for remaining
        const crossChargeType = CROSS_CHARGE_MAP[leaveType];
        if (crossChargeType) {
          const crossBalance = await getEmployeeBalance(String(employeeId), crossChargeType);
          const remaining = workingDays - primaryBalance;

          if (crossBalance >= remaining) {
            daysWithPay = workingDays;
            crossChargedFrom = crossChargeType;
            actualPaymentStatus = 'WITH_PAY';
          } else {
            daysWithPay = primaryBalance + crossBalance;
            daysWithoutPay = workingDays - daysWithPay;
            crossChargedFrom = crossBalance > 0 ? crossChargeType : null;
            actualPaymentStatus = daysWithPay > 0 ? 'PARTIAL' : 'WITHOUT_PAY';
          }
        } else {
          daysWithoutPay = workingDays - primaryBalance;
          actualPaymentStatus = 'PARTIAL';
        }
      } else {
        // No primary credits, check cross-charging
        const crossChargeType = CROSS_CHARGE_MAP[leaveType];
        if (crossChargeType) {
          const crossBalance = await getEmployeeBalance(String(employeeId), crossChargeType);
          if (crossBalance >= workingDays) {
            daysWithPay = workingDays;
            crossChargedFrom = crossChargeType;
            actualPaymentStatus = 'WITH_PAY';
          } else if (crossBalance > 0) {
            daysWithPay = crossBalance;
            daysWithoutPay = workingDays - crossBalance;
            crossChargedFrom = crossChargeType;
            actualPaymentStatus = 'PARTIAL';
          } else {
            daysWithoutPay = workingDays;
            actualPaymentStatus = 'WITHOUT_PAY';
          }
        } else {
          daysWithoutPay = workingDays;
          actualPaymentStatus = 'WITHOUT_PAY';
        }
      }
    } else if (!isWithPay) {
      // Employee explicitly requested LWOP
      daysWithoutPay = workingDays;
      actualPaymentStatus = 'WITHOUT_PAY';
    } else if (isSpecialLeave) {
      // Special leaves don't deduct from VL/SL
      daysWithPay = workingDays;
      actualPaymentStatus = 'WITH_PAY';
    }

    const attachmentPath = req.file ? `leaves/${req.file.filename}` : null;

    // Insert application
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO leave_applications 
       (employee_id, leave_type, start_date, end_date, working_days, is_with_pay, 
        actual_payment_status, days_with_pay, days_without_pay, cross_charged_from, 
        reason, attachment_path, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        employeeId,
        leaveType,
        startDate,
        endDate,
        workingDays,
        isWithPay,
        actualPaymentStatus,
        daysWithPay,
        daysWithoutPay,
        crossChargedFrom,
        reason,
        attachmentPath,
      ]
    );

    // Create notifications
    try {
      await createNotification({
        recipientId: String(employeeId),
        senderId: null,
        title: 'Leave Request Submitted',
        message: `Your ${leaveType} request from ${startDate} to ${endDate} (${workingDays} working days) has been submitted.`,
        type: 'leave_request_pending',
        referenceId: result.insertId,
      });

      await notifyAdmins({
        senderId: String(employeeId),
        title: 'New Leave Request',
        message: `Employee ${employeeId} requested ${leaveType} from ${startDate} to ${endDate}.`,
        type: 'leave_request',
        referenceId: result.insertId,
      });
    } catch (notifyError) {
      console.error('Notification failed:', notifyError);
    }

    res.status(201).json({
      message: 'Leave application submitted successfully',
      id: result.insertId,
      workingDays,
      actualPaymentStatus,
      daysWithPay,
      daysWithoutPay,
      crossChargedFrom,
      needsMedCert,
    });
  } catch (err) {
    const error = err as Error;
    console.error('Apply Leave Error:', error.message);
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};

/**
 * Get employee's own leave applications
 */
export const getMyLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user.employeeId || authReq.user.id;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE la.employee_id = ?';
    const queryParams: (string | number)[] = [employeeId];

    if (search) {
      whereClause += ' AND (la.leave_type LIKE ? OR la.reason LIKE ?)';
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    if (status) {
      whereClause += ' AND la.status = ?';
      queryParams.push(status);
    }

    // Count total
    const [countResult] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM leave_applications la ${whereClause}`,
      queryParams
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch applications
    const [applications] = await db.query<LeaveApplicationRow[]>(
      `SELECT la.*, a.first_name, a.last_name, a.department
       FROM leave_applications la
       LEFT JOIN authentication a ON la.employee_id = a.employee_id
       ${whereClause}
       ORDER BY la.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.status(200).json({
      applications,
      pagination: { page, limit, totalItems, totalPages },
    });
  } catch (err) {
    console.error('getMyLeaves error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Get all leave applications (admin)
 */
export const getAllLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const department = (req.query.department as string) || '';
    const status = (req.query.status as string) || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams: (string | number)[] = [];

    if (search) {
      whereClause += ` AND (la.leave_type LIKE ? OR a.first_name LIKE ? OR a.last_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (department) {
      whereClause += ' AND a.department = ?';
      queryParams.push(department);
    }

    if (status) {
      whereClause += ' AND la.status = ?';
      queryParams.push(status);
    }

    // Count total
    const [countResult] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total 
       FROM leave_applications la
       LEFT JOIN authentication a ON la.employee_id = a.employee_id
       ${whereClause}`,
      queryParams
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch applications
    const [applications] = await db.query<LeaveApplicationRow[]>(
      `SELECT la.*, 
              COALESCE(a.first_name, '') as first_name,
              COALESCE(a.last_name, '') as last_name,
              COALESCE(a.department, 'N/A') as department
       FROM leave_applications la
       LEFT JOIN authentication a ON la.employee_id = a.employee_id
       ${whereClause}
       ORDER BY la.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.status(200).json({
      applications,
      pagination: { page, limit, totalItems, totalPages },
    });
  } catch (err) {
    console.error('getAllLeaves error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Process leave (admin uploads form)
 */
export const processLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const adminId = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Admin';
    const adminFormPath = req.file ? `leaves/${req.file.filename}` : null;

    await db.query(
      `UPDATE leave_applications SET status = 'Processing', admin_form_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [adminFormPath, id]
    );

    // Notify employee
    const [rows] = await db.query<LeaveApplicationRow[]>(
      'SELECT employee_id FROM leave_applications WHERE id = ?',
      [id]
    );
    if (rows.length > 0) {
      await createNotification({
        recipientId: rows[0].employee_id,
        senderId: adminId,
        title: 'Leave Request Processing',
        message: 'Your leave request is being processed. Please check for the admin form.',
        type: 'leave_process',
        referenceId: parseInt(id),
      });
    }

    res.status(200).json({ message: 'Leave processed, form sent to employee' });
  } catch (err) {
    console.error('processLeave error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Finalize leave (employee uploads signed form)
 */
export const finalizeLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : null;
    const finalPath = req.file ? `leaves/${req.file.filename}` : null;

    await db.query(
      `UPDATE leave_applications SET status = 'Finalizing', final_attachment_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [finalPath, id]
    );

    await notifyAdmins({
      senderId: employeeId,
      title: 'Leave Request Finalized',
      message: `Employee ${employeeId} has uploaded the signed leave form.`,
      type: 'leave_finalize',
      referenceId: parseInt(id),
    });

    res.status(200).json({ message: 'Final form submitted' });
  } catch (err) {
    console.error('finalizeLeave error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Approve leave application
 */
export const approveLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const approvedBy = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Admin';

    // Get application details
    const [rows] = await db.query<LeaveApplicationRow[]>(
      'SELECT * FROM leave_applications WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const application = rows[0];
    const isSpecialLeave = SPECIAL_LEAVES_NO_DEDUCTION.includes(application.leave_type);

    // Deduct credits if WITH_PAY and not special leave
    if ((application.actual_payment_status === 'WITH_PAY' || application.actual_payment_status === 'PARTIAL') && !isSpecialLeave) {
      const primaryCreditType = LEAVE_TO_CREDIT_MAP[application.leave_type] as CreditType || 'Vacation Leave';
      
      if (application.cross_charged_from) {
        // Cross-charging: deduct from fallback credit type
        await updateBalance(
          application.employee_id,
          application.cross_charged_from as CreditType,
          -Number(application.days_with_pay),
          'DEDUCTION',
          parseInt(id),
          'leave_application',
          `${application.leave_type} cross-charged from ${application.cross_charged_from}`,
          approvedBy
        );
      } else {
        // Normal deduction
        await updateBalance(
          application.employee_id,
          primaryCreditType,
          -Number(application.days_with_pay),
          'DEDUCTION',
          parseInt(id),
          'leave_application',
          `${application.leave_type} approved`,
          approvedBy
        );
      }
    }

    // Track LWOP for service record
    if (application.days_without_pay > 0) {
      await updateLWOPSummary(application.employee_id, Number(application.days_without_pay));
    }

    // Update application status
    await db.query(
      `UPDATE leave_applications SET status = 'Approved', approved_by = ?, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [approvedBy, id]
    );

    // Update DTR records
    try {
      const startDate = new Date(application.start_date);
      const endDate = new Date(application.end_date);
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay();

        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          await db.query(
            `INSERT INTO daily_time_records (employee_id, date, time_in, time_out, late_minutes, undertime_minutes, status)
             VALUES (?, ?, NULL, NULL, 0, 0, 'Leave')
             ON DUPLICATE KEY UPDATE status = 'Leave', updated_at = CURRENT_TIMESTAMP`,
            [application.employee_id, dateStr]
          );
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (dtrErr) {
      console.error('DTR update error:', dtrErr);
    }

    // Log to Service Record (career history)
    const eventType = application.days_without_pay > 0 ? 'LWOP' : 'Leave';
    await logToServiceRecord(
      application.employee_id,
      eventType as any,
      String(application.start_date).split('T')[0],
      String(application.end_date).split('T')[0],
      application.leave_type,
      Number(application.working_days),
      application.actual_payment_status !== 'WITHOUT_PAY',
      `${application.leave_type} - ${application.actual_payment_status}`,
      parseInt(id),
      'leave_application',
      approvedBy
    );

    // Notify employee
    await createNotification({
      recipientId: application.employee_id,
      senderId: approvedBy,
      title: 'Leave Request Approved',
      message: `Your ${application.leave_type} request from ${application.start_date} to ${application.end_date} has been approved.`,
      type: 'leave_request_approved',
      referenceId: parseInt(id),
    });

    res.status(200).json({ message: 'Leave approved successfully' });
  } catch (err) {
    const error = err as Error;
    console.error('approveLeave error:', error.message);
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};

/**
 * Reject leave application
 */
export const rejectLeave = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authReq = req as AuthenticatedRequest;
    const approvedBy = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Admin';

    // Validate input
    const validation = rejectLeaveSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: 'Validation Error',
        errors: validation.error.format(),
      });
      return;
    }

    const { reason } = validation.data;

    await db.query(
      `UPDATE leave_applications SET status = 'Rejected', rejection_reason = ?, approved_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [reason, approvedBy, id]
    );

    // Notify employee
    const [rows] = await db.query<LeaveApplicationRow[]>(
      'SELECT employee_id, start_date, end_date FROM leave_applications WHERE id = ?',
      [id]
    );
    if (rows.length > 0) {
      await createNotification({
        recipientId: rows[0].employee_id,
        senderId: approvedBy,
        title: 'Leave Request Rejected',
        message: `Your leave request for ${rows[0].start_date} to ${rows[0].end_date} has been rejected. Reason: ${reason}`,
        type: 'leave_request_rejected',
        referenceId: parseInt(id),
      });
    }

    res.status(200).json({ message: 'Leave rejected' });
  } catch (err) {
    console.error('rejectLeave error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

// ============================================================================
// Credit Management Functions
// ============================================================================

/**
 * Get employee's credit balances
 */
export const getMyCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user.employeeId || authReq.user.id;
    const year = parseInt(req.query.year as string) || getCurrentYear();

    const [credits] = await db.query<LeaveBalanceRow[]>(
      `SELECT lb.*, a.first_name, a.last_name, a.department
       FROM leave_balances lb
       LEFT JOIN authentication a ON lb.employee_id = a.employee_id
       WHERE lb.employee_id = ? AND lb.year = ?`,
      [employeeId, year]
    );

    res.status(200).json({ credits, year });
  } catch (err) {
    console.error('getMyCredits error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Get specific employee's credits (admin)
 */
export const getEmployeeCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const year = parseInt(req.query.year as string) || getCurrentYear();

    const [credits] = await db.query<LeaveBalanceRow[]>(
      `SELECT lb.*, a.first_name, a.last_name, a.department
       FROM leave_balances lb
       LEFT JOIN authentication a ON lb.employee_id = a.employee_id
       WHERE lb.employee_id = ? AND lb.year = ?`,
      [employeeId, year]
    );

    res.status(200).json({ credits, year });
  } catch (err) {
    console.error('getEmployeeCredits error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Get all employee credits (admin)
 */
export const getAllEmployeeCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const year = parseInt(req.query.year as string) || getCurrentYear();
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE lb.year = ?';
    const queryParams: (string | number)[] = [year];

    if (search) {
      whereClause += ` AND (a.first_name LIKE ? OR a.last_name LIKE ? OR lb.employee_id LIKE ?)`;
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Count total
    const [countResult] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total
       FROM leave_balances lb
       LEFT JOIN authentication a ON lb.employee_id = a.employee_id
       ${whereClause}`,
      queryParams
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch credits
    const [credits] = await db.query<RowDataPacket[]>(
      `SELECT lb.*, 
              COALESCE(a.first_name, '') as first_name,
              COALESCE(a.last_name, '') as last_name,
              COALESCE(a.department, 'N/A') as department
       FROM leave_balances lb
       LEFT JOIN authentication a ON lb.employee_id = a.employee_id
       ${whereClause}
       ORDER BY a.last_name, a.first_name, lb.credit_type
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.status(200).json({
      credits,
      year,
      pagination: { page, limit, totalItems, totalPages },
    });
  } catch (err) {
    console.error('getAllEmployeeCredits error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Update employee credit (admin)
 */
export const updateEmployeeCredit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const authReq = req as AuthenticatedRequest;
    const adminId = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Admin';

    // Validate input
    const validation = creditUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: 'Validation Error',
        errors: validation.error.format(),
      });
      return;
    }

    const { creditType, balance, remarks } = validation.data;
    const year = getCurrentYear();

    // Get current balance
    const currentBalance = await getEmployeeBalance(employeeId, creditType, year);
    const adjustment = balance - currentBalance;

    // Update balance
    const result = await updateBalance(
      employeeId,
      creditType,
      adjustment,
      'ADJUSTMENT',
      undefined,
      'manual',
      remarks || `Admin adjustment: ${currentBalance} → ${balance}`,
      adminId
    );

    if (result.success) {
      res.status(200).json({
        message: 'Credit updated successfully',
        previousBalance: currentBalance,
        newBalance: result.newBalance,
      });
    } else {
      res.status(500).json({ message: 'Failed to update credit' });
    }
  } catch (err) {
    console.error('updateEmployeeCredit error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Delete employee credit record (admin)
 */
export const deleteEmployeeCredit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const creditType = req.query.creditType as string;
    const year = parseInt(req.query.year as string) || getCurrentYear();

    if (!creditType) {
      res.status(400).json({ message: 'Credit type is required' });
      return;
    }

    await db.query(
      'DELETE FROM leave_balances WHERE employee_id = ? AND credit_type = ? AND year = ?',
      [employeeId, creditType, year]
    );

    res.status(200).json({ message: 'Credit record deleted' });
  } catch (err) {
    console.error('deleteEmployeeCredit error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

// ============================================================================
// Monthly Accrual Functions
// ============================================================================

/**
 * Accrue monthly credits for all employees
 * CSC: 1.250 VL + 1.250 SL per month
 */
export const accrueMonthlyCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const adminId = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'System';

    // Validate input
    const validation = accrueCreditsSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        message: 'Validation Error',
        errors: validation.error.format(),
      });
      return;
    }

    const { month, year, employeeIds } = validation.data;

    // Get employees to accrue (regular employees only)
    let employees: { employee_id: string }[];
    if (employeeIds && employeeIds.length > 0) {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT employee_id FROM authentication WHERE employee_id IN (?) AND role != 'admin'`,
        [employeeIds]
      );
      employees = rows as { employee_id: string }[];
    } else {
      const [rows] = await db.query<RowDataPacket[]>(
        `SELECT employee_id FROM authentication WHERE role != 'admin'`
      );
      employees = rows as { employee_id: string }[];
    }

    let accruedCount = 0;
    const remarks = `Monthly accrual for ${month}/${year}`;

    for (const employee of employees) {
      // Accrue VL
      await updateBalance(
        employee.employee_id,
        'Vacation Leave',
        MONTHLY_VL_ACCRUAL,
        'ACCRUAL',
        undefined,
        'manual',
        remarks,
        adminId
      );

      // Accrue SL
      await updateBalance(
        employee.employee_id,
        'Sick Leave',
        MONTHLY_SL_ACCRUAL,
        'ACCRUAL',
        undefined,
        'manual',
        remarks,
        adminId
      );

      accruedCount++;
    }

    res.status(200).json({
      message: `Monthly credits accrued for ${accruedCount} employees`,
      month,
      year,
      vlAccrued: MONTHLY_VL_ACCRUAL,
      slAccrued: MONTHLY_SL_ACCRUAL,
    });
  } catch (err) {
    console.error('accrueMonthlyCredits error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Allocate default credits for new employee
 */
export const allocateDefaultCredits = async (employeeId: string): Promise<void> => {
  try {
    const year = getCurrentYear();
    const defaults = [
      { type: 'Vacation Leave' as CreditType, balance: 15.000 },
      { type: 'Sick Leave' as CreditType, balance: 15.000 },
      { type: 'Special Privilege Leave' as CreditType, balance: 3.000 },
    ];

    for (const credit of defaults) {
      // Check if exists
      const existing = await getEmployeeBalance(employeeId, credit.type, year);
      if (existing === 0) {
        await updateBalance(
          employeeId,
          credit.type,
          credit.balance,
          'ACCRUAL',
          undefined,
          'manual',
          'Initial allocation for new employee',
          'System'
        );
      }
    }

    console.log(`Allocated default credits for ${employeeId}`);
  } catch (error) {
    console.error(`Failed to allocate credits for ${employeeId}:`, error);
  }
};

// ============================================================================
// Ledger Functions
// ============================================================================

/**
 * Get employee's leave ledger (transaction history)
 */
export const getMyLedger = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user.employeeId || authReq.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const creditType = (req.query.creditType as string) || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE employee_id = ?';
    const queryParams: (string | number)[] = [employeeId];

    if (creditType) {
      whereClause += ' AND credit_type = ?';
      queryParams.push(creditType);
    }

    // Count total
    const [countResult] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM leave_ledger ${whereClause}`,
      queryParams
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch ledger entries
    const [entries] = await db.query<LeaveLedgerRow[]>(
      `SELECT * FROM leave_ledger ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.status(200).json({
      entries,
      pagination: { page, limit, totalItems, totalPages },
    });
  } catch (err) {
    console.error('getMyLedger error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Get specific employee's ledger (admin)
 */
export const getEmployeeLedger = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const creditType = (req.query.creditType as string) || '';
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE employee_id = ?';
    const queryParams: (string | number)[] = [employeeId];

    if (creditType) {
      whereClause += ' AND credit_type = ?';
      queryParams.push(creditType);
    }

    // Count total
    const [countResult] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM leave_ledger ${whereClause}`,
      queryParams
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch ledger entries
    const [entries] = await db.query<LeaveLedgerRow[]>(
      `SELECT * FROM leave_ledger ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    res.status(200).json({
      entries,
      pagination: { page, limit, totalItems, totalPages },
    });
  } catch (err) {
    console.error('getEmployeeLedger error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

// ============================================================================
// Holiday Management
// ============================================================================

/**
 * Get holidays for a year
 */
export const getHolidays = async (req: Request, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || getCurrentYear();

    const [holidays] = await db.query<HolidayRow[]>(
      'SELECT * FROM holidays WHERE year = ? ORDER BY date',
      [year]
    );

    res.status(200).json({ holidays, year });
  } catch (err) {
    console.error('getHolidays error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Add a holiday (admin)
 */
export const addHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, date, type } = req.body;

    if (!name || !date || !type) {
      res.status(400).json({ message: 'Name, date, and type are required' });
      return;
    }

    const year = new Date(date).getFullYear();

    await db.query(
      'INSERT INTO holidays (name, date, type, year) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = ?, type = ?',
      [name, date, type, year, name, type]
    );

    res.status(201).json({ message: 'Holiday added successfully' });
  } catch (err) {
    console.error('addHoliday error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Delete a holiday (admin)
 */
export const deleteHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await db.query('DELETE FROM holidays WHERE id = ?', [id]);

    res.status(200).json({ message: 'Holiday deleted' });
  } catch (err) {
    console.error('deleteHoliday error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

// ============================================================================
// LWOP Summary
// ============================================================================

/**
 * Get LWOP summary for employee
 */
export const getLWOPSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;

    const [summary] = await db.query<LWOPSummaryRow[]>(
      'SELECT * FROM lwop_summary WHERE employee_id = ? ORDER BY year DESC',
      [employeeId]
    );

    res.status(200).json({ summary });
  } catch (err) {
    console.error('getLWOPSummary error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Calculate LWOP deduction for payroll
 * Formula: (Monthly Salary / 22) × LWOP Days
 */
export const calculateLWOPDeduction = (monthlySalary: number, lwopDays: number): number => {
  const dailyRate = monthlySalary / WORKING_DAYS_PER_MONTH;
  return Number((dailyRate * lwopDays).toFixed(2));
};

// ============================================================================
// Service Record & Tardiness Processing
// ============================================================================

/**
 * Get employee's service record (career history)
 */
export const getServiceRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;

    const [records] = await db.query<RowDataPacket[]>(
      `SELECT * FROM service_records WHERE employee_id = ? ORDER BY event_date DESC`,
      [employeeId]
    );

    // Calculate total LWOP days for retirement impact
    const [lwopTotal] = await db.query<RowDataPacket[]>(
      `SELECT SUM(days_count) as total_lwop_days 
       FROM service_records 
       WHERE employee_id = ? AND event_type = 'LWOP'`,
      [employeeId]
    );

    res.status(200).json({ 
      records,
      totalLWOPDays: lwopTotal[0]?.total_lwop_days || 0
    });
  } catch (err) {
    console.error('getServiceRecord error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Process monthly tardiness → VL deduction or LWOP
 * Called at end of month to convert accumulated tardiness
 * Formula: Total Minutes / 480 = Decimal Days
 */
export const processMonthlyTardiness = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, year, employeeIds } = req.body;
    const authReq = req as AuthenticatedRequest;
    const processedBy = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Admin';

    const targetMonth = month || new Date().getMonth(); // 0-indexed, so January=0
    const targetYear = year || new Date().getFullYear();

    // Get all employees with tardiness for the month
    const [employees] = await db.query<RowDataPacket[]>(
      `SELECT DISTINCT employee_id FROM tardiness_summary 
       WHERE year = ? AND month = ? AND processed_at IS NULL
       ${employeeIds ? 'AND employee_id IN (?)' : ''}`,
      employeeIds ? [targetYear, targetMonth, employeeIds] : [targetYear, targetMonth]
    );

    const results: Array<{
      employeeId: string;
      daysEquivalent: number;
      deductedFromVL: number;
      chargedAsLWOP: number;
    }> = [];

    for (const emp of employees) {
      const result = await calculateTardinessDeduction(emp.employee_id, targetYear, targetMonth);
      
      if (result.daysEquivalent > 0) {
        results.push({
          employeeId: emp.employee_id,
          ...result
        });
      }
    }

    res.status(200).json({
      message: `Processed tardiness for ${results.length} employees`,
      month: targetMonth,
      year: targetYear,
      results,
      processedBy
    });
  } catch (err) {
    console.error('processMonthlyTardiness error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Get total LWOP for retirement calculation
 * CSC Rule: LWOP days are not counted as years of service
 */
export const getTotalLWOPForRetirement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;

    // From LWOP Summary table
    const [lwopSummary] = await db.query<RowDataPacket[]>(
      `SELECT SUM(total_lwop_days) as total_lwop_days, MAX(cumulative_lwop_days) as cumulative
       FROM lwop_summary WHERE employee_id = ?`,
      [employeeId]
    );

    // From Service Records (LWOP events)
    const [serviceRecords] = await db.query<RowDataPacket[]>(
      `SELECT SUM(days_count) as service_record_lwop 
       FROM service_records 
       WHERE employee_id = ? AND event_type = 'LWOP'`,
      [employeeId]
    );

    const totalDays = Math.max(
      lwopSummary[0]?.cumulative || 0,
      serviceRecords[0]?.service_record_lwop || 0
    );

    // Calculate impact: 365 LWOP days = 1 year extension before retirement
    const yearsExtension = Math.floor(totalDays / 365);
    const remainingDays = totalDays % 365;

    res.status(200).json({
      employeeId,
      totalLWOPDays: totalDays,
      retirementImpact: {
        yearsExtension,
        remainingDays,
        message: yearsExtension > 0 
          ? `Employee must extend service by ${yearsExtension} year(s) and ${remainingDays} day(s) before retirement`
          : 'No retirement extension required'
      }
    });
  } catch (err) {
    console.error('getTotalLWOPForRetirement error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};
