import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { holidays, leaveBalances, leaveLedger, lwopSummary, serviceRecords, tardinessSummary, leaveApplications, dailyTimeRecords, authentication, internalPolicies } from '../db/schema.js';
import { eq, and, between, ne, or, sql, desc, lt, lte, gte } from 'drizzle-orm';
import { createNotification, notifyAdmins } from './notificationController.js';
import { accrueCreditsForMonth } from '../services/leaveAccrualService.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { type CreditType, type LeaveType, type PaymentStatus, type TransactionType, SPECIAL_LEAVES_NO_DEDUCTION,
  LEAVE_TO_CREDIT_MAP, WORKING_DAYS_PER_MONTH,
} from '../types/leave.types.js';
import { applyLeaveSchema, rejectLeaveSchema, creditUpdateSchema, accrueCreditsSchema, validateVLAdvanceFiling,
} from '../schemas/leaveSchema.js';
import { formatFullName } from '../utils/nameUtils.js';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface LeavePolicyContent {
  types: string[];
  annualLimits: Record<string, number>;
  advanceFilingDays: {
    days: number;
    appliesTo: string[];
    description?: string;
  };
  sickLeaveWindow: {
    maxDaysAfterReturn: number;
    description?: string;
  };
  crossChargeMap: Record<string, CreditType>;
  leaveToCreditMap: Record<string, CreditType>;
  specialLeavesNoDeduction: string[];
  requiredAttachments: Record<string, { condition: string; required: string }>;
  forcedLeaveRule: {
    minimumVLRequired: number;
    description: string;
  };
  deemedApprovalGracePeriod: number;
  deemedApproval: {
    days: number;
    description: string;
    reference: string;
  };
}


const getHolidaysInRange = async (startDate: string, endDate: string): Promise<string[]> => {
  try {
    const rows = await db.select({
      date: holidays.date
    }).from(holidays)
    .where(and(
      between(holidays.date, startDate, endDate),
      ne(holidays.type, 'Special Working')
    ));
    
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
  const holidaysList = await getHolidaysInRange(startDate, endDate);
  const holidaySet = new Set(holidaysList);

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
 * Process any pending leave applications that are "Deemed Approved" per CSC rules.
 * Rule: Pending action for >= 5 working days.
 */
const processDeemedApprovedLeaves = async (): Promise<void> => {
    try {
        const policy = await getLeavePolicy();
        if (!policy) return;

        const gracePeriod = policy.deemedApprovalGracePeriod || 5;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        // 1. Fetch ALL pending leaves
        const pendingLeaves = await db.query.leaveApplications.findMany({
            where: eq(leaveApplications.status, 'Pending'),
        });

        if (pendingLeaves.length === 0) return;

        // 2. Identify date range for holidays
        let oldestDate = today;
        for (const app of pendingLeaves) {
            const createdDate = new Date(app.createdAt!);
            if (createdDate < oldestDate) oldestDate = createdDate;
        }
        
        const startDateStr = oldestDate.toISOString().split('T')[0];
        const holidaysInRange = await getHolidaysInRange(startDateStr, todayStr);
        const holidaySet = new Set(holidaysInRange);

        // 3. Helper for working days within this context
        const countWorkingDaysFast = (start: string, end: string): number => {
            let count = 0;
            const cur = new Date(start);
            const stop = new Date(end);
            while (cur <= stop) {
                const dateStr = cur.toISOString().split('T')[0];
                const dayOfWeek = cur.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
                    count++;
                }
                cur.setDate(cur.getDate() + 1);
            }
            return count;
        };

        const approvedBy = 'SYSTEM (Deemed Approved)';

        for (const application of pendingLeaves) {
            const createdDate = new Date(application.createdAt!);
            const createdStr = createdDate.toISOString().split('T')[0];
            
            const workingDaysPassed = countWorkingDaysFast(createdStr, todayStr);

            if (workingDaysPassed >= gracePeriod) {
                console.log(`[AUTO-APPROVE] Processing Leave ID ${application.id} (Employee: ${application.employeeId})`);
                
                const isSpecialLeave = policy.specialLeavesNoDeduction.includes(application.leaveType);

                // Credit Deduction
                if ((application.actualPaymentStatus === 'WITH_PAY' || application.actualPaymentStatus === 'PARTIAL') && !isSpecialLeave) {
                    const primaryCreditType = policy.leaveToCreditMap[application.leaveType] as CreditType || 'Vacation Leave';
                    if (application.crossChargedFrom) {
                        await updateBalance(application.employeeId, application.crossChargedFrom as CreditType, -Number(application.daysWithPay), 'DEDUCTION', application.id, 'leave_application', `${application.leaveType} cross-charged (Deemed Approved)`, approvedBy);
                    } else {
                        await updateBalance(application.employeeId, primaryCreditType, -Number(application.daysWithPay), 'DEDUCTION', application.id, 'leave_application', `${application.leaveType} (Deemed Approved)`, approvedBy);
                    }
                }

                // LWOP Tracking
                if (Number(application.daysWithoutPay) > 0) {
                    await updateLWOPSummary(application.employeeId, Number(application.daysWithoutPay));
                }

                // Status Update
                await db.update(leaveApplications)
                    .set({ status: 'Approved', approvedBy, approvedAt: sql`CURRENT_TIMESTAMP`, updatedAt: sql`CURRENT_TIMESTAMP` })
                    .where(eq(leaveApplications.id, application.id));

                // DTR Update
                const dtrStart = new Date(application.startDate);
                const dtrEnd = new Date(application.endDate);
                const dtrCur = new Date(dtrStart);
                while (dtrCur <= dtrEnd) {
                    const dateStr = dtrCur.toISOString().split('T')[0];
                    const dayOfWeek = dtrCur.getDay();
                    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                        await db.insert(dailyTimeRecords).values({ employeeId: application.employeeId, date: dateStr, status: 'Leave' })
                            .onDuplicateKeyUpdate({ set: { status: 'Leave', updatedAt: sql`CURRENT_TIMESTAMP` } });
                    }
                    dtrCur.setDate(dtrCur.getDate() + 1);
                }

                // Service Record
                const eventType = Number(application.daysWithoutPay) > 0 ? 'LWOP' : 'Leave';
                await logToServiceRecord(application.employeeId, eventType as 'LWOP' | 'Leave', String(application.startDate).split('T')[0], String(application.endDate).split('T')[0], application.leaveType, Number(application.workingDays), application.actualPaymentStatus !== 'WITHOUT_PAY', `${application.leaveType} - Deemed Approved`, application.id, 'leave_application', approvedBy);
            }
        }
    } catch (error) {
        console.error('[AUTO-APPROVE] Fatal Error:', error);
    }
};

/**
 * Get dynamic leave policy from database
 */
const getLeavePolicy = async (): Promise<LeavePolicyContent | null> => {
  try {
    const policy = await db.query.internalPolicies.findFirst({
      where: eq(internalPolicies.category, 'leave')
    });

    if (!policy) return null;

    return typeof policy.content === 'string' 
      ? JSON.parse(policy.content) 
      : policy.content as LeavePolicyContent;
  } catch (error) {
    console.error('Error fetching leave policy:', error);
    return null;
  }
};

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
    const row = await db.query.leaveBalances.findFirst({
      where: and(
        eq(leaveBalances.employeeId, employeeId),
        eq(leaveBalances.creditType, creditType),
        eq(leaveBalances.year, targetYear)
      )
    });
    return row ? Number(row.balance) : 0;
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
    const newBalance = Number((currentBalance + amount).toFixed(3)).toString();

    // Update or insert balance
    await db.insert(leaveBalances).values({
      employeeId,
      creditType,
      balance: newBalance,
      year
    }).onDuplicateKeyUpdate({
      set: {
        balance: newBalance,
        updatedAt: sql`CURRENT_TIMESTAMP`
      }
    });

    // Create ledger entry
    await db.insert(leaveLedger).values({
      employeeId,
      creditType,
      transactionType,
      amount: amount.toString(),
      balanceAfter: newBalance,
      referenceId,
      referenceType,
      remarks,
      createdBy
    });

    return { success: true, newBalance: Number(newBalance) };
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
    const prevRow = await db.query.lwopSummary.findFirst({
      where: and(
        eq(lwopSummary.employeeId, employeeId),
        lt(lwopSummary.year, year)
      ),
      orderBy: [desc(lwopSummary.year)]
    });

    const prevCumulative = prevRow ? Number(prevRow.cumulativeLwopDays) : 0;
    const totalDays = lwopDays.toString();
    const cumulativeDays = (prevCumulative + lwopDays).toString();

    await db.insert(lwopSummary).values({
      employeeId,
      year,
      totalLwopDays: totalDays,
      cumulativeLwopDays: cumulativeDays
    }).onDuplicateKeyUpdate({
      set: {
        totalLwopDays: sql`total_lwop_days + ${totalDays}`,
        cumulativeLwopDays: sql`cumulative_lwop_days + ${totalDays}`,
        updatedAt: sql`CURRENT_TIMESTAMP`
      }
    });
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
    await db.insert(serviceRecords).values({
      employeeId,
      eventType,
      eventDate,
      endDate,
      leaveType,
      daysCount: daysCount.toString(),
      isWithPay: isWithPay ? true : false,
      remarks,
      referenceId,
      referenceType,
      processedBy
    });
    console.log(`Logged ${eventType} to service record for ${employeeId}`);
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
    const tardiness = await db.query.tardinessSummary.findFirst({
      where: and(
        eq(tardinessSummary.employeeId, employeeId),
        eq(tardinessSummary.year, year),
        eq(tardinessSummary.month, month)
      )
    });

    if (!tardiness) {
      return { daysEquivalent: 0, deductedFromVL: 0, chargedAsLWOP: 0 };
    }

    // Fetch employee's dailyTargetHours for accurate deduction
    const empRecord = await db.select({ dailyTargetHours: authentication.dailyTargetHours })
      .from(authentication)
      .where(eq(authentication.employeeId, employeeId))
      .limit(1);
    const dailyTargetMinutes = (Number(empRecord[0]?.dailyTargetHours) || 8) * 60;

    const totalMinutes = (tardiness.totalLateMinutes || 0) + (tardiness.totalUndertimeMinutes || 0);
    const daysEquivalent = totalMinutes / dailyTargetMinutes; // Dynamic: based on employee's actual target hours

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
    await db.update(tardinessSummary)
      .set({ 
        deductedFromVl: deductedFromVL.toString(), 
        chargedAsLwop: chargedAsLWOP.toString(), 
        processedAt: sql`CURRENT_TIMESTAMP`, 
        processedBy: 'SYSTEM'
      })
      .where(and(
        eq(tardinessSummary.employeeId, employeeId),
        eq(tardinessSummary.year, year),
        eq(tardinessSummary.month, month)
      ));

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

    const policy = await getLeavePolicy();
    if (!policy) {
      res.status(500).json({ message: 'Internal Error: Leave policy not configured.' });
      return;
    }

    // Validate advance filing
    const advanceFiling = policy.advanceFilingDays;
    if (advanceFiling.appliesTo.includes(leaveType) && !validateVLAdvanceFiling(startDate)) {
      res.status(400).json({
        message: `${leaveType} must be filed at least ${advanceFiling.days} days in advance per policy.`,
      });
      return;
    }

    // Validate Sick Leave window
    if (leaveType === 'Sick Leave') {
      const start = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const window = policy.sickLeaveWindow.maxDaysAfterReturn;
      if (diffDays > window) {
        res.status(400).json({
          message: `Sick Leave must be filed within ${window} days of returning to work.`,
        });
        return;
      }
    }

    // Check annual limits from policy
    const annualLimit = policy.annualLimits[leaveType];
    if (annualLimit !== undefined) {
      const year = new Date(startDate).getFullYear();
      
      const usageResult = await db.select({ 
        totalDays: sql<string>`sum(${leaveApplications.workingDays})` 
      })
      .from(leaveApplications)
      .where(and(
        eq(leaveApplications.employeeId, String(employeeId)),
        eq(leaveApplications.leaveType, leaveType as LeaveType),
        sql`YEAR(${leaveApplications.startDate}) = ${year}`,
        ne(leaveApplications.status, 'Rejected'),
        ne(leaveApplications.status, 'Cancelled')
      ));
      
      const usedDays = Number(usageResult[0]?.totalDays || 0);
      const newTotal = usedDays + workingDays;

      if (newTotal > annualLimit) {
        res.status(400).json({
          message: `You have reached the annual limit of ${annualLimit} days for ${leaveType}. (Used: ${usedDays}, Requested: ${workingDays})`,
        });
        return;
      }
    }

    // Check SL medical certificate requirement (>= 5 days)
    // Check for mandatory attachments based on policy
    let needsMedCert = false;
    let requiredDocLabel = 'supporting document';

    if (policy.requiredAttachments) {
      for (const [key, requirement] of Object.entries(policy.requiredAttachments)) {
        const isSickLeaveRule = key.startsWith('sickLeave') && leaveType === 'Sick Leave';
        const isSpecificTypeRule = key === leaveType.charAt(0).toLowerCase() + leaveType.slice(1).replace(/\s/g, '');
        const isMatch = isSpecificTypeRule || isSickLeaveRule;

        if (isMatch) {
          if (isSickLeaveRule) {
            if (workingDays >= 5) {
              needsMedCert = true;
              requiredDocLabel = requirement.required;
            }
          } else {
            needsMedCert = true;
            requiredDocLabel = requirement.required;
          }
        }
      }
    }

    // Validate attachment
    if (needsMedCert && !req.file) {
      res.status(400).json({ message: `A valid ${requiredDocLabel} is strictly required for ${leaveType}.` });
      return;
    }

    // Determine payment status
    const isSpecialLeave = policy.specialLeavesNoDeduction.includes(leaveType);
    let actualPaymentStatus: PaymentStatus = 'WITH_PAY';
    let daysWithPay = 0;
    let daysWithoutPay = 0;
    let crossChargedFrom: CreditType | null = null;

    if (isWithPay && !isSpecialLeave) {
      // Get credit type to deduct from
      const primaryCreditType = policy.leaveToCreditMap[leaveType as keyof typeof policy.leaveToCreditMap] || leaveType as CreditType;
      const primaryBalance = await getEmployeeBalance(String(employeeId), primaryCreditType);

      if (primaryBalance >= workingDays) {
        // Sufficient primary credits
        daysWithPay = workingDays;
        actualPaymentStatus = 'WITH_PAY';
      } else if (primaryBalance > 0) {
        // Partial credits available
        daysWithPay = primaryBalance;

        // Check cross-charging for remaining
        const crossChargeType = policy.crossChargeMap[leaveType as keyof typeof policy.crossChargeMap];
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
        const crossChargeType = policy.crossChargeMap[leaveType as keyof typeof policy.crossChargeMap];
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
    const [result] = await db.insert(leaveApplications).values({
      employeeId: String(employeeId),
      leaveType: leaveType as LeaveType,
      startDate,
      endDate,
      workingDays: workingDays.toString(),
      isWithPay: isWithPay ? true : false,
      actualPaymentStatus,
      daysWithPay: daysWithPay.toString(),
      daysWithoutPay: daysWithoutPay.toString(),
      crossChargedFrom,
      reason,
      attachmentPath,
      status: 'Pending'
    });

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
    const employeeId = String(authReq.user.employeeId || authReq.user.id);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const offset = (page - 1) * limit;

    const conditions = [eq(leaveApplications.employeeId, employeeId)];
    if (search) {
      conditions.push(or(
        sql`${leaveApplications.leaveType} LIKE ${`%${search}%`}`,
        sql`${leaveApplications.reason} LIKE ${`%${search}%`}`
      )!);
    }
    if (status) {
      conditions.push(eq(leaveApplications.status, status as 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'));
    }

    const where = and(...conditions);

    // Count total
    const [countResult] = await db.select({ total: sql<number>`count(*)` })
      .from(leaveApplications)
      .where(where);
    const totalItems = Number(countResult.total);
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch applications
    const leaves = await db.select({
      id: leaveApplications.id,
      employee_id: leaveApplications.employeeId,
      leave_type: leaveApplications.leaveType,
      start_date: leaveApplications.startDate,
      end_date: leaveApplications.endDate,
      working_days: leaveApplications.workingDays,
      status: leaveApplications.status,
      reason: leaveApplications.reason,
      created_at: leaveApplications.createdAt,
      first_name: authentication.firstName,
      last_name: authentication.lastName,
      middle_name: authentication.middleName,
      suffix: authentication.suffix,
      department: authentication.department,
      with_pay: leaveApplications.isWithPay,
      attachment_path: leaveApplications.attachmentPath
    })
    .from(leaveApplications)
    .leftJoin(authentication, eq(leaveApplications.employeeId, authentication.employeeId))
    .where(where)
    .orderBy(desc(leaveApplications.createdAt))
    .limit(limit)
    .offset(offset);

    const formattedLeaves = leaves.map(l => ({
        ...l,
        employee_name: formatFullName(l.last_name, l.first_name, l.middle_name, l.suffix)
    }));

    res.status(200).json({
      leaves: formattedLeaves,
      pagination: { page, limit, totalItems, totalPages },
    });
  } catch (err) {
    console.error('getMyLeaves error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Get all leave applications (Admin)
 */
export const getAllLeaves = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const department = (req.query.department as string) || '';
    const status = (req.query.status as string) || '';
    const offset = (page - 1) * limit;

    // --- DEEMED APPROVED AUTO-BYPASS (CSC Rule) ---
    // Any leave pending for >= 5 working days is automatically approved.
    await processDeemedApprovedLeaves();
    // --- END DEEMED APPROVED AUTO-BYPASS ---

    const conditions = [];
    if (search) {
      conditions.push(or(
        sql`${leaveApplications.leaveType} LIKE ${`%${search}%`}`,
        sql`${authentication.firstName} LIKE ${`%${search}%`}`,
        sql`${authentication.lastName} LIKE ${`%${search}%`}`
      )!);
    }
    if (department) {
      conditions.push(eq(authentication.department, department));
    }
    if (status) {
      conditions.push(eq(leaveApplications.status, status as 'Pending' | 'Approved' | 'Rejected' | 'Cancelled'));
    }
    
    // New Filters
    const startDate = (req.query.startDate as string) || '';
    const endDate = (req.query.endDate as string) || '';
    const employeeId = (req.query.employeeId as string) || ''; // Can be name or ID

    if (startDate && endDate) {
      // Overlap logic: application starts before report ends AND ends after report starts
      conditions.push(and(
        lte(leaveApplications.startDate, endDate),
        gte(leaveApplications.endDate, startDate)
      )); 
    } else if (startDate) {
      conditions.push(gte(leaveApplications.endDate, startDate));
    } else if (endDate) {
      conditions.push(lte(leaveApplications.startDate, endDate));
    }
    if (employeeId) {
       // Check if it matches ID or Name (since frontend sends Name often)
       conditions.push(or(
         eq(leaveApplications.employeeId, employeeId),
         sql`${authentication.firstName} LIKE ${`%${employeeId}%`}`,
         sql`${authentication.lastName} LIKE ${`%${employeeId}%`}`
       )!);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Count total
    const [countResult] = await db.select({ total: sql<number>`count(*)` })
      .from(leaveApplications)
      .leftJoin(authentication, eq(leaveApplications.employeeId, authentication.employeeId))
      .where(where);
    const totalItems = Number(countResult.total);
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch applications
    const leaves = await db.select({
      id: leaveApplications.id,
      employee_id: leaveApplications.employeeId,
      leave_type: leaveApplications.leaveType,
      start_date: leaveApplications.startDate,
      end_date: leaveApplications.endDate,
      working_days: leaveApplications.workingDays,
      status: leaveApplications.status,
      created_at: leaveApplications.createdAt,
      with_pay: leaveApplications.isWithPay, 
      first_name: sql<string>`COALESCE(${authentication.firstName}, '')`,
      last_name: sql<string>`COALESCE(${authentication.lastName}, '')`,
      middle_name: authentication.middleName,
      suffix: authentication.suffix,
      department: sql<string>`COALESCE(${authentication.department}, 'N/A')`,
      current_balance: sql<number>`COALESCE(${leaveBalances.balance}, 0)`
    })
    .from(leaveApplications)
    .leftJoin(authentication, eq(leaveApplications.employeeId, authentication.employeeId))
    .leftJoin(leaveBalances, and(
      eq(leaveBalances.employeeId, leaveApplications.employeeId),
      eq(leaveBalances.creditType, leaveApplications.leaveType),
      // Match year of application start date
      eq(leaveBalances.year, sql`YEAR(${leaveApplications.startDate})`)
    ))
    .where(where)
    .orderBy(desc(leaveApplications.createdAt))
    .limit(limit)
    .offset(offset);

    const formattedLeaves = leaves.map(l => ({
        ...l,
        employee_name: formatFullName(l.last_name, l.first_name, l.middle_name, l.suffix)
    }));

    res.status(200).json({
      leaves: formattedLeaves,
      applications: formattedLeaves, // Keep for backward compatibility if any other part uses it
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
    const { id } = req.params as { id: string };
    const authReq = req as AuthenticatedRequest;
    const adminId = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Admin';
    const adminFormPath = req.file ? `leaves/${req.file.filename}` : null;

    await db.update(leaveApplications)
      .set({ status: 'Processing', adminFormPath, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(leaveApplications.id, parseInt(id)));

    // Notify employee
    const application = await db.query.leaveApplications.findFirst({
      where: eq(leaveApplications.id, parseInt(id)),
      columns: { employeeId: true }
    });

    if (application) {
      await createNotification({
        recipientId: application.employeeId,
        senderId: adminId,
        title: 'Leave Request Processing',
        message: 'Your leave request is being processed. Please check for the Admin form.',
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
    const { id } = req.params as { id: string };
    const authReq = req as AuthenticatedRequest;
    const employeeId = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : null;
    const finalPath = req.file ? `leaves/${req.file.filename}` : null;

    await db.update(leaveApplications)
      .set({ status: 'Finalizing', finalAttachmentPath: finalPath, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(leaveApplications.id, parseInt(id)));

    if (employeeId) {
      await notifyAdmins({
        senderId: employeeId,
        title: 'Leave Request Finalized',
        message: `Employee ${employeeId} has uploaded the signed leave form.`,
        type: 'leave_finalize',
        referenceId: parseInt(id),
      });
    }

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
    const { id } = req.params as { id: string };
    const authReq = req as AuthenticatedRequest;
    const approvedBy = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Admin';

    // Get application details
    const application = await db.query.leaveApplications.findFirst({
      where: eq(leaveApplications.id, parseInt(id))
    });

    if (!application) {
      res.status(404).json({ message: 'Application not found' });
      return;
    }

    const policy = await getLeavePolicy();
    const isSpecialLeave = policy?.specialLeavesNoDeduction.includes(application.leaveType) ?? SPECIAL_LEAVES_NO_DEDUCTION.includes(application.leaveType);

    // Deduct credits if WITH_PAY and not special leave
    if ((application.actualPaymentStatus === 'WITH_PAY' || application.actualPaymentStatus === 'PARTIAL') && !isSpecialLeave) {
      const primaryCreditType = (policy?.leaveToCreditMap[application.leaveType as keyof typeof policy.leaveToCreditMap] as CreditType) 
        || (LEAVE_TO_CREDIT_MAP[application.leaveType] as CreditType) 
        || 'Vacation Leave';
      
      if (application.crossChargedFrom) {
        // Cross-charging: deduct from fallback credit type
        await updateBalance(
          application.employeeId,
          application.crossChargedFrom as CreditType,
          -Number(application.daysWithPay),
          'DEDUCTION',
          parseInt(id),
          'leave_application',
          `${application.leaveType} cross-charged from ${application.crossChargedFrom}`,
          approvedBy
        );
      } else {
        // Normal deduction
        await updateBalance(
          application.employeeId,
          primaryCreditType,
          -Number(application.daysWithPay),
          'DEDUCTION',
          parseInt(id),
          'leave_application',
          `${application.leaveType} approved`,
          approvedBy
        );
      }
    }

    // Track LWOP for service record
    if (Number(application.daysWithoutPay) > 0) {
      await updateLWOPSummary(application.employeeId, Number(application.daysWithoutPay));
    }

    // Update application status
    await db.update(leaveApplications)
      .set({ 
        status: 'Approved', 
        approvedBy, 
        approvedAt: sql`CURRENT_TIMESTAMP`, 
        updatedAt: sql`CURRENT_TIMESTAMP` 
      })
      .where(eq(leaveApplications.id, parseInt(id)));

    // Update DTR records
    try {
      const startDate = new Date(application.startDate);
      const endDate = new Date(application.endDate);
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayOfWeek = currentDate.getDay();

        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          await db.insert(dailyTimeRecords).values({
            employeeId: application.employeeId,
            date: dateStr,
            status: 'Leave'
          }).onDuplicateKeyUpdate({
            set: {
              status: 'Leave',
              updatedAt: sql`CURRENT_TIMESTAMP`
            }
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } catch (dtrErr) {
      console.error('DTR update error:', dtrErr);
    }

    // Log to Service Record (career history)
    const eventType = Number(application.daysWithoutPay) > 0 ? 'LWOP' : 'Leave';
    await logToServiceRecord(
      application.employeeId,
      eventType as 'LWOP' | 'Leave',
      String(application.startDate).split('T')[0],
      String(application.endDate).split('T')[0],
      application.leaveType,
      Number(application.workingDays),
      application.actualPaymentStatus !== 'WITHOUT_PAY',
      `${application.leaveType} - ${application.actualPaymentStatus}`,
      parseInt(id),
      'leave_application',
      approvedBy
    );

    // Notify employee
    await createNotification({
      recipientId: application.employeeId,
      senderId: approvedBy,
      title: 'Leave Request Approved',
      message: `Your ${application.leaveType} request from ${application.startDate} to ${application.endDate} has been approved.`,
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
    const { id } = req.params as { id: string };
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

    await db.update(leaveApplications)
      .set({ 
        status: 'Rejected', 
        rejectionReason: reason, 
        approvedBy, 
        updatedAt: sql`CURRENT_TIMESTAMP` 
      })
      .where(eq(leaveApplications.id, parseInt(id)));

    // Notify employee
    const application = await db.query.leaveApplications.findFirst({
      where: eq(leaveApplications.id, parseInt(id)),
      columns: { employeeId: true, startDate: true, endDate: true }
    });

    if (application) {
      await createNotification({
        recipientId: application.employeeId,
        senderId: approvedBy,
        title: 'Leave Request Rejected',
        message: `Your leave request for ${application.startDate} to ${application.endDate} has been rejected. Reason: ${reason}`,
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
    const employeeId = String(authReq.user.employeeId || authReq.user.id);
    const year = parseInt(req.query.year as string) || getCurrentYear();

    const credits = await db.select({
      id: leaveBalances.id,
      employeeId: leaveBalances.employeeId,
      credit_type: leaveBalances.creditType,
      balance: leaveBalances.balance,
      year: leaveBalances.year,
      updatedAt: leaveBalances.updatedAt,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      department: authentication.department
    })
    .from(leaveBalances)
    .leftJoin(authentication, eq(leaveBalances.employeeId, authentication.employeeId))
    .where(and(
      eq(leaveBalances.employeeId, employeeId),
      eq(leaveBalances.year, year)
    ));

    const formattedCredits = credits.map(c => ({
        ...c,
        employee_name: formatFullName(c.lastName, c.firstName, c.middleName, c.suffix)
    }));

    res.status(200).json({ credits: formattedCredits, year });
  } catch (err) {
    console.error('getMyCredits error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Get specific employee's credits (Admin)
 */
export const getEmployeeCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params as { employeeId: string };
    const year = parseInt(req.query.year as string) || getCurrentYear();

    const credits = await db.select({
      id: leaveBalances.id,
      employeeId: leaveBalances.employeeId,
      credit_type: leaveBalances.creditType,
      balance: leaveBalances.balance,
      year: leaveBalances.year,
      updatedAt: leaveBalances.updatedAt,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      department: authentication.department
    })
    .from(leaveBalances)
    .leftJoin(authentication, eq(leaveBalances.employeeId, authentication.employeeId))
    .where(and(
      eq(leaveBalances.employeeId, employeeId),
      eq(leaveBalances.year, year)
    ));

    const formattedCredits = credits.map(c => ({
        ...c,
        employee_name: formatFullName(c.lastName, c.firstName, c.middleName, c.suffix)
    }));

    res.status(200).json({ credits: formattedCredits, year });
  } catch (err) {
    console.error('getEmployeeCredits error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Get all employee credits (Admin)
 */
export const getAllEmployeeCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const year = parseInt(req.query.year as string) || getCurrentYear();
    const offset = (page - 1) * limit;

    const conditions = [eq(leaveBalances.year, year)];
    if (search) {
      conditions.push(or(
        sql`COALESCE(${authentication.firstName}, '') LIKE ${`%${search}%`}`,
        sql`COALESCE(${authentication.lastName}, '') LIKE ${`%${search}%`}`,
        sql`TRIM(CONCAT(${authentication.lastName}, ', ', ${authentication.firstName}, IF(${authentication.middleName} IS NOT NULL && ${authentication.middleName} != '', CONCAT(' ', SUBSTRING(${authentication.middleName}, 1, 1), '.'), ''), IF(${authentication.suffix} IS NOT NULL && ${authentication.suffix} != '', CONCAT(' ', ${authentication.suffix}), ''))) LIKE ${`%${search}%`}`,
        sql`COALESCE(${leaveBalances.employeeId}, '') LIKE ${`%${search}%`}`
      )!);
    }

    const where = and(...conditions);

    // Count total
    const [countResult] = await db.select({ total: sql<number>`count(*)` })
      .from(leaveBalances)
      .leftJoin(authentication, eq(leaveBalances.employeeId, authentication.employeeId))
      .where(where);
    const totalItems = Number(countResult.total);
    const totalPages = Math.ceil(totalItems / limit);

    // Subquery for Usage (Deductions from Ledger)
    // We assume deductions are negative values in the ledger
    // usage = ABS(SUM(amount)) where transactionType = 'DEDUCTION' AND year matches
    
    // Fetch credits with usage calculation
    const credits = await db.select({
      id: leaveBalances.id,
      employee_id: leaveBalances.employeeId,
      credit_type: leaveBalances.creditType,
      balance: leaveBalances.balance,
      year: leaveBalances.year,
      updated_at: leaveBalances.updatedAt,
      first_name: sql<string>`COALESCE(${authentication.firstName}, '')`,
      last_name: sql<string>`COALESCE(${authentication.lastName}, '')`,
      middle_name: authentication.middleName,
      suffix: authentication.suffix,
      department: sql<string>`COALESCE(${authentication.department}, 'N/A')`,
      // Calculate usage from ledger for this year
      days_used_with_pay: sql<number>`(
        SELECT COALESCE(ABS(SUM(ll.amount)), 0)
        FROM ${leaveLedger} ll
        WHERE ll.employee_id = ${leaveBalances.employeeId}
          AND ll.credit_type = ${leaveBalances.creditType}
          AND ll.transaction_type = 'DEDUCTION'
          AND YEAR(ll.created_at) = ${year}
      )`,
      // Calculate LWOP from approved applications for this leave type & year
      days_used_without_pay: sql<number>`(
        SELECT COALESCE(SUM(la.days_without_pay), 0)
        FROM ${leaveApplications} la
        WHERE la.employee_id = ${leaveBalances.employeeId}
          AND la.leave_type = ${leaveBalances.creditType}
          AND la.status = 'Approved'
          AND YEAR(la.start_date) = ${year}
      )`
    })
    .from(leaveBalances)
    .leftJoin(authentication, eq(leaveBalances.employeeId, authentication.employeeId))
    .where(where)
    .orderBy(authentication.lastName, authentication.firstName, leaveBalances.creditType)
    .limit(limit)
    .offset(offset);

    const formattedCredits = credits.map(c => ({
        ...c,
        employee_name: formatFullName(c.last_name, c.first_name, c.middle_name, c.suffix)
    }));

    res.status(200).json({
      credits: formattedCredits,
      year,
      pagination: { page, limit, totalItems, totalPages },
    });
  } catch (err) {
    console.error('getAllEmployeeCredits error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Update employee credit (Admin)
 */
export const updateEmployeeCredit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params as { employeeId: string };
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
 * Delete employee credit record (Admin)
 */
export const deleteEmployeeCredit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params as { employeeId: string };
    const creditType = req.query.creditType as string;
    const year = parseInt(req.query.year as string) || getCurrentYear();

    if (!creditType) {
      res.status(400).json({ message: 'Credit type is required' });
      return;
    }

    await db.delete(leaveBalances)
      .where(and(
        eq(leaveBalances.employeeId, employeeId),
        eq(leaveBalances.creditType, creditType as 'Vacation Leave' | 'Sick Leave' | 'Special Privilege Leave' | 'Forced Leave' | 'Maternity Leave' | 'Paternity Leave'),
        eq(leaveBalances.year, year)
      ));

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

    // Call service to accrue credits
    const result = await accrueCreditsForMonth(month, year, employeeIds);

    res.status(200).json({
      message: `Monthly credits accrued for ${result.processedCount} employees`,
      month,
      year,
      details: result
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
    const employeeId = String(authReq.user.employeeId || authReq.user.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const creditType = (req.query.creditType as string) || '';
    const offset = (page - 1) * limit;

    const conditions = [eq(leaveLedger.employeeId, employeeId)];
    if (creditType) {
      conditions.push(eq(leaveLedger.creditType, creditType as 'Vacation Leave' | 'Sick Leave' | 'Special Privilege Leave' | 'Forced Leave' | 'Maternity Leave' | 'Paternity Leave'));
    }

    const where = and(...conditions);

    // Count total
    const [countResult] = await db.select({ total: sql<number>`count(*)` })
      .from(leaveLedger)
      .where(where);
    const totalItems = Number(countResult.total);
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch ledger entries
    const entries = await db.select()
      .from(leaveLedger)
      .where(where)
      .orderBy(desc(leaveLedger.createdAt))
      .limit(limit)
      .offset(offset);

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
 * Get specific employee's ledger (Admin)
 */
export const getEmployeeLedger = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params as { employeeId: string };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const creditType = (req.query.creditType as string) || '';
    const offset = (page - 1) * limit;

    const conditions = [eq(leaveLedger.employeeId, employeeId)];
    if (creditType) {
      conditions.push(eq(leaveLedger.creditType, creditType as 'Vacation Leave' | 'Sick Leave' | 'Special Privilege Leave' | 'Forced Leave' | 'Maternity Leave' | 'Paternity Leave'));
    }

    const where = and(...conditions);

    // Count total
    const [countResult] = await db.select({ total: sql<number>`count(*)` })
      .from(leaveLedger)
      .where(where);
    const totalItems = Number(countResult.total);
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch ledger entries
    const entries = await db.select()
      .from(leaveLedger)
      .where(where)
      .orderBy(desc(leaveLedger.createdAt))
      .limit(limit)
      .offset(offset);

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

    const result = await db.select()
      .from(holidays)
      .where(eq(holidays.year, year))
      .orderBy(holidays.date);

    res.status(200).json({ holidays: result, year });
  } catch (err) {
    console.error('getHolidays error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Add a holiday (Admin)
 */
export const addHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, date, type } = req.body;

    if (!name || !date || !type) {
      res.status(400).json({ message: 'Name, date, and type are required' });
      return;
    }

    const year = new Date(date).getFullYear();

    await db.insert(holidays).values({
      name,
      date,
      type: type as 'Regular' | 'Special Non-Working' | 'Special Working',
      year
    }).onDuplicateKeyUpdate({
      set: {
        name,
        type: type as 'Regular' | 'Special Non-Working' | 'Special Working'
      }
    });

    res.status(201).json({ message: 'Holiday added successfully' });
  } catch (err) {
    console.error('addHoliday error:', err);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Delete a holiday (Admin)
 */
export const deleteHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    await db.delete(holidays).where(eq(holidays.id, parseInt(id)));

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
    const { employeeId } = req.params as { employeeId: string };

    const summary = await db.select()
      .from(lwopSummary)
      .where(eq(lwopSummary.employeeId, employeeId))
      .orderBy(desc(lwopSummary.year));

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
    const { employeeId } = req.params as { employeeId: string };

    const records = await db.select()
      .from(serviceRecords)
      .where(eq(serviceRecords.employeeId, employeeId))
      .orderBy(desc(serviceRecords.eventDate));

    // Calculate total LWOP days for retirement impact
    const [lwopTotal] = await db.select({ 
      totalLwopDays: sql<number>`SUM(${serviceRecords.daysCount})` 
    })
    .from(serviceRecords)
    .where(and(
      eq(serviceRecords.employeeId, employeeId),
      eq(serviceRecords.eventType, 'LWOP')
    ));

    res.status(200).json({ 
      records,
      totalLWOPDays: lwopTotal?.totalLwopDays || 0
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
    const conditions = [
      eq(tardinessSummary.year, targetYear),
      eq(tardinessSummary.month, targetMonth),
      sql`processed_at IS NULL`
    ];
    if (employeeIds && employeeIds.length > 0) {
      conditions.push(sql`${tardinessSummary.employeeId} IN (${employeeIds})`);
    }

    const employees = await db.select({
      employeeId: tardinessSummary.employeeId
    })
    .from(tardinessSummary)
    .where(and(...conditions));

    const results: Array<{
      employeeId: string;
      daysEquivalent: number;
      deductedFromVL: number;
      chargedAsLWOP: number;
    }> = [];

    for (const emp of employees) {
      const result = await calculateTardinessDeduction(emp.employeeId, targetYear, targetMonth);
      
      if (result.daysEquivalent > 0) {
        results.push({
          employeeId: emp.employeeId,
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
    const { employeeId } = req.params as { employeeId: string };

    // From LWOP Summary table
    const [lwopTotalSum] = await db.select({
      totalLwopDays: sql<number>`SUM(${lwopSummary.totalLwopDays})`,
      maxCumulative: sql<number>`MAX(${lwopSummary.cumulativeLwopDays})`
    })
    .from(lwopSummary)
    .where(eq(lwopSummary.employeeId, employeeId));

    // From Service Records (LWOP events)
    const [serviceRecordsTotal] = await db.select({
      serviceRecordLwop: sql<number>`SUM(${serviceRecords.daysCount})`
    })
    .from(serviceRecords)
    .where(and(
      eq(serviceRecords.employeeId, employeeId),
      eq(serviceRecords.eventType, 'LWOP')
    ));

    const totalDays = Math.max(
      lwopTotalSum?.maxCumulative || 0,
      serviceRecordsTotal?.serviceRecordLwop || 0
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
