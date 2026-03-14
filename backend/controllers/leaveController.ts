import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { holidays, leaveBalances, leaveLedger, lwopSummary, serviceRecords, tardinessSummary, leaveApplications, dailyTimeRecords, authentication, internalPolicies } from '../db/schema.js';
import { eq, and, between, ne, or, sql, desc, lt, lte, gte } from 'drizzle-orm';
import { createNotification, notifyAdmins } from './notificationController.js';
import { accrueCreditsForMonth } from '../services/leaveAccrualService.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { type CreditType, type LeaveType, type PaymentStatus, type TransactionType, CREDIT_TYPES, SPECIAL_LEAVES_NO_DEDUCTION, LEAVE_TO_CREDIT_MAP, WORKING_DAYS_PER_MONTH,} from '../types/leave.types.js';
import { applyLeaveSchema, rejectLeaveSchema, creditUpdateSchema, accrueCreditsSchema, leavePolicySchema, type LeavePolicyContentStrict,} from '../schemas/leaveSchema.js';
import { formatFullName } from '../utils/nameUtils.js';

// T1 FIX: Typed interface for multer request (replaces `req as any`)
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// T1 FIX: Typed record for leave update data (replaces `any`)
// Uses Record to stay compatible with Drizzle's .set() which expects partial column types
type LeaveUpdateData = Partial<{
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Processing' | 'Finalizing';
  updatedAt: ReturnType<typeof sql>;
  adminFormPath: string;
  finalAttachmentPath: string;
}>;

// ============================================================================
// Types & Interfaces
// ============================================================================

// Removed manually typed LeavePolicyContent in favor of Zod inference LeavePolicyContentStrict


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
  } catch (_error) {

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

                const isSpecialLeave = policy.specialLeavesNoDeduction.includes(application.leaveType);

                // S1 FIX: Re-check balance before deduction (may have changed since application was filed)
                // Credit Deduction
                let finalSafeDeduction = 0;
                // S1 FIX: Re-check balance before deduction (may have changed since application was filed)
                // Credit Deduction
                if ((application.actualPaymentStatus === 'WITH_PAY' || application.actualPaymentStatus === 'PARTIAL') && !isSpecialLeave) {
                    const primaryCreditType = policy.leaveToCreditMap[application.leaveType] as CreditType || 'Vacation Leave';
                    const deductionAmount = Number(application.workingDays); // Calculate absolute required deduction based on total working days requested
                    
                    if (application.crossChargedFrom) {
                        const currentBalance = await getEmployeeBalance(application.employeeId, application.crossChargedFrom as CreditType);
                        finalSafeDeduction = Math.min(deductionAmount, currentBalance);
                        if (finalSafeDeduction > 0) {
                            await updateBalance(application.employeeId, application.crossChargedFrom as CreditType, -finalSafeDeduction, 'DEDUCTION', application.id, 'leave_application', `${application.leaveType} cross-charged (Deemed Approved)`, approvedBy);
                        }
                        // Remainder becomes LWOP
                        const remainder = deductionAmount - finalSafeDeduction;
                        if (remainder > 0) {
                            await updateLWOPSummary(application.employeeId, remainder);
                        }
                    } else {
                        const currentBalance = await getEmployeeBalance(application.employeeId, primaryCreditType);
                        finalSafeDeduction = Math.min(deductionAmount, currentBalance);
                        if (finalSafeDeduction > 0) {
                            await updateBalance(application.employeeId, primaryCreditType, -finalSafeDeduction, 'DEDUCTION', application.id, 'leave_application', `${application.leaveType} (Deemed Approved)`, approvedBy);
                        }
                        const remainder = deductionAmount - finalSafeDeduction;
                        if (remainder > 0) {
                            await updateLWOPSummary(application.employeeId, remainder);
                        }
                    }
                } else if (isSpecialLeave) {
                    finalSafeDeduction = Number(application.workingDays); // Special leaves are always fully paid without deduction
                }

                // Recalculate and update final daysWithPay and daysWithoutPay to ensure historical accuracy based on live exact deductions
                let finalPaymentStatus = application.actualPaymentStatus;
                if (!isSpecialLeave && application.actualPaymentStatus !== 'WITHOUT_PAY') {
                    if (finalSafeDeduction === Number(application.workingDays)) finalPaymentStatus = 'WITH_PAY';
                    else if (finalSafeDeduction > 0) finalPaymentStatus = 'PARTIAL';
                    else finalPaymentStatus = 'WITHOUT_PAY';
                }

                const finalWithoutPay = Number(application.workingDays) - finalSafeDeduction;

                // LWOP Tracking (for explicit WITHOUT_PAY or purely zero balance leaves calculated above)
                if (application.actualPaymentStatus === 'WITHOUT_PAY') {
                    await updateLWOPSummary(application.employeeId, Number(application.workingDays));
                }

                // Status Update
                await db.update(leaveApplications)
                    .set({ 
                        status: 'Approved', 
                        approvedBy, 
                        approvedAt: sql`CURRENT_TIMESTAMP`, 
                        updatedAt: sql`CURRENT_TIMESTAMP`,
                        daysWithPay: finalSafeDeduction.toString(),
                        daysWithoutPay: finalWithoutPay.toString(),
                        actualPaymentStatus: finalPaymentStatus
                    })
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
      // S2 FIX: Log errors instead of silently swallowing
      console.error('[LEAVE] Error processing deemed approved leaves:', error);
    }
};

/**
 * Get dynamic leave policy from database
 */
const getLeavePolicy = async (): Promise<LeavePolicyContentStrict> => {
  const fallbackPolicy: LeavePolicyContentStrict = {
    types: ['Vacation Leave', 'Sick Leave', 'Special Privilege Leave', 'Forced Leave', 'Maternity Leave', 'Paternity Leave', 'Study Leave', 'Solo Parent Leave', 'Rehabilitation Leave', 'Special Leave Benefits for Women', 'Special Emergency Leave', 'Calamity Leave'],
    annualLimits: {
      'Vacation Leave': 15,
      'Sick Leave': 15,
      'Special Privilege Leave': 3,
      'Forced Leave': 5,
      'Solo Parent Leave': 7,
    },
    advanceFilingDays: { days: 5, appliesTo: ['Vacation Leave', 'Forced Leave'], description: 'Must be filed 5 working days in advance' },
    sickLeaveWindow: { maxDaysAfterReturn: 5, description: 'Must be filed within 5 working days upon return' },
    crossChargeMap: { 'Sick Leave': 'Vacation Leave', 'Forced Leave': 'Vacation Leave' },
    leaveToCreditMap: { 'Vacation Leave': 'Vacation Leave', 'Sick Leave': 'Sick Leave', 'Special Privilege Leave': 'Special Privilege Leave', 'Forced Leave': 'Vacation Leave', 'Solo Parent Leave': 'Solo Parent Leave' },
    specialLeavesNoDeduction: ['Study Leave', 'Maternity Leave', 'Paternity Leave', 'Rehabilitation Leave', 'Special Leave Benefits for Women', 'Special Emergency Leave', 'Calamity Leave'],
    requiredAttachments: {}, 
    forcedLeaveRule: { minimumVLRequired: 10, description: 'Forced leave is mandatory if VL balance is 10 or more.' },
    deemedApprovalGracePeriod: 5,
    deemedApproval: { days: 5, description: 'CSC Rule: Pending for 5+ days is deemed approved.', reference: 'CSC Omnibus Rules on Leave' }
  };

  try {
    const results = await db.select()
      .from(internalPolicies)
      .where(eq(internalPolicies.category, 'leave'))
      .limit(1);

    const policy = results[0];

    if (policy) {
        const rawJson = typeof policy.content === 'string' 
          ? JSON.parse(policy.content) 
          : policy.content;
          
        return leavePolicySchema.parse(rawJson);
    }

    return fallbackPolicy;
  } catch (_error) {
    return fallbackPolicy;
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
  } catch (_error) {

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
  } catch (_error) {

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
  } catch (_error) {
      /* empty */

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

  } catch (_error) {
      /* empty */

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
  } catch (_error) {

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

    const todayStr = new Date().toISOString().split('T')[0];

    // Validate advance filing using calculateWorkingDays instead of calendar days
    const advanceFiling = policy.advanceFilingDays;
    if (advanceFiling.appliesTo.includes(leaveType)) {
      const workingDaysAdvance = await calculateWorkingDays(todayStr, startDate);
      if (workingDaysAdvance <= advanceFiling.days) {
        res.status(400).json({
          message: `${leaveType} must be filed at least ${advanceFiling.days} working days in advance per policy.`,
        });
        return;
      }
    }

    // Validate Sick Leave window (filed upon return, meaning after endDate)
    if (leaveType === 'Sick Leave') {
      const workingDaysPassed = await calculateWorkingDays(endDate, todayStr);
      const window = policy.sickLeaveWindow.maxDaysAfterReturn;
      if (workingDaysPassed > window + 1) { // +1 because the range calculation usually includes both start and end dates
        res.status(400).json({
          message: `Sick Leave must be filed within ${window} working days upon returning to work.`,
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

    // Determine payment status
    const isSpecialLeave = policy.specialLeavesNoDeduction.includes(leaveType);
    let actualPaymentStatus: PaymentStatus = 'WITH_PAY';
    let daysWithPay = 0;
    let daysWithoutPay = 0;
    let crossChargedFrom: CreditType | null = null;

    if (isWithPay && !isSpecialLeave) {
      // Get credit type to deduct from
      const mappedCreditType = policy.leaveToCreditMap[leaveType as keyof typeof policy.leaveToCreditMap];
      const primaryCreditType = mappedCreditType || (CREDIT_TYPES.find(ct => ct === leaveType) || null);
      
      if (!primaryCreditType) {
        res.status(400).json({ message: `Leave type ${leaveType} does not have a linked credit type for deduction.` });
        return;
      }

      const primaryBalance = await getEmployeeBalance(String(employeeId), primaryCreditType as CreditType);

      if (primaryBalance >= workingDays) {
        // Sufficient primary credits
        daysWithPay = workingDays;
        actualPaymentStatus = 'WITH_PAY';
      } else if (primaryBalance > 0) {
        // Partial credits available
        daysWithPay = primaryBalance;

        // Check cross-charging for remaining
        const crossChargeType = policy.crossChargeMap[leaveType as keyof typeof policy.crossChargeMap] as CreditType | undefined;
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
        const crossChargeType = policy.crossChargeMap[leaveType as keyof typeof policy.crossChargeMap] as CreditType | undefined;
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
      attachmentPath: (req as MulterRequest).file?.filename || null,
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
    } catch (_notifyError) {
      /* empty */

    }

    res.status(201).json({
      message: 'Leave application submitted successfully',
      id: result.insertId,
      workingDays,
      actualPaymentStatus,
      daysWithPay,
      daysWithoutPay,
      crossChargedFrom,
    });
  } catch (err) {
    const error = err as Error;

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
      employeeId: leaveApplications.employeeId,
      leaveType: leaveApplications.leaveType,
      startDate: leaveApplications.startDate,
      endDate: leaveApplications.endDate,
      workingDays: leaveApplications.workingDays,
      status: leaveApplications.status,
      reason: leaveApplications.reason,
      createdAt: leaveApplications.createdAt,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      department: authentication.department,
      withPay: leaveApplications.isWithPay
    })
    .from(leaveApplications)
    .leftJoin(authentication, eq(leaveApplications.employeeId, authentication.employeeId))
    .where(where)
    .orderBy(desc(leaveApplications.createdAt))
    .limit(limit)
    .offset(offset);

    const formattedLeaves = leaves.map(l => ({
        ...l,
        employeeName: formatFullName(l.lastName, l.firstName, l.middleName, l.suffix)
    }));

    res.status(200).json({
      leaves: formattedLeaves,
      applications: formattedLeaves, // Align with frontend hook useLeaveData
      pagination: { page, limit, totalItems, totalPages },
    });
  } catch (_err) {

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
      employeeId: leaveApplications.employeeId,
      leaveType: leaveApplications.leaveType,
      startDate: leaveApplications.startDate,
      endDate: leaveApplications.endDate,
      workingDays: leaveApplications.workingDays,
      status: leaveApplications.status,
      createdAt: leaveApplications.createdAt,
      withPay: leaveApplications.isWithPay, 
      firstName: sql<string>`COALESCE(${authentication.firstName}, '')`,
      lastName: sql<string>`COALESCE(${authentication.lastName}, '')`,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      department: sql<string>`COALESCE(${authentication.department}, 'N/A')`,
      currentBalance: sql<number>`COALESCE(${leaveBalances.balance}, 0)`
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
        employeeName: formatFullName(l.lastName, l.firstName, l.middleName, l.suffix)
    }));

    res.status(200).json({
      leaves: formattedLeaves,
      applications: formattedLeaves, // Keep for backward compatibility if any other part uses it
      pagination: { page, limit, totalItems, totalPages },
    });
  } catch (_err) {

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
    const adminId = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Administrator';
    const file = (req as MulterRequest).file;

    const updateData: LeaveUpdateData = { 
      status: 'Processing', 
      updatedAt: sql`CURRENT_TIMESTAMP` 
    };

    if (file) {
      updateData.adminFormPath = file.filename;
    }

    await db.update(leaveApplications)
      .set(updateData)
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
        message: 'Your leave request is being processed.',
        type: 'leave_process',
        referenceId: parseInt(id),
      });
    }

    res.status(200).json({ message: 'Leave processed' });
  } catch (_err) {

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
    const file = (req as MulterRequest).file;

    const updateData: LeaveUpdateData = { 
      status: 'Finalizing', 
      updatedAt: sql`CURRENT_TIMESTAMP` 
    };

    if (file) {
      updateData.finalAttachmentPath = file.filename;
    }

    await db.update(leaveApplications)
      .set(updateData)
      .where(eq(leaveApplications.id, parseInt(id)));

    if (employeeId) {
      await notifyAdmins({
        senderId: employeeId,
        title: 'Leave Request Finalized',
        message: `Employee ${employeeId} has finalized the leave request.`,
        type: 'leave_finalize',
        referenceId: parseInt(id),
      });
    }

    res.status(200).json({ message: 'Final form submitted' });
  } catch (_err) {

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
    const approvedBy = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Administrator';

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
    } catch (_dtrErr) {
      /* empty */

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
    const approvedBy = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Administrator';

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
  } catch (_err) {

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
      creditType: leaveBalances.creditType,
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
        employeeName: formatFullName(c.lastName, c.firstName, c.middleName, c.suffix)
    }));

    res.status(200).json({ credits: formattedCredits, year });

  } catch (_err) {

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
      creditType: leaveBalances.creditType,
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
        employeeName: formatFullName(c.lastName, c.firstName, c.middleName, c.suffix)
    }));

    res.status(200).json({ credits: formattedCredits, year });

  } catch (_err) {

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
      employeeId: leaveBalances.employeeId,
      creditType: leaveBalances.creditType,
      balance: leaveBalances.balance,
      year: leaveBalances.year,
      updatedAt: leaveBalances.updatedAt,
      firstName: sql<string>`COALESCE(${authentication.firstName}, '')`,
      lastName: sql<string>`COALESCE(${authentication.lastName}, '')`,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      department: sql<string>`COALESCE(${authentication.department}, 'N/A')`,
      daysUsedWithPay: sql<number>`(
        SELECT COALESCE(ABS(SUM(ll.amount)), 0)
        FROM ${leaveLedger} ll
        WHERE ll.employee_id = ${leaveBalances.employeeId}
          AND ll.credit_type = ${leaveBalances.creditType}
          AND ll.transaction_type = 'DEDUCTION'
          AND YEAR(ll.created_at) = ${year}
      )`,
      daysUsedWithoutPay: sql<number>`(
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
        employeeName: formatFullName(c.lastName, c.firstName, c.middleName, c.suffix)
    }));

    res.status(200).json({
      credits: formattedCredits,
      year,
      pagination: { page, limit, totalItems, totalPages },
    });

  } catch (_err) {

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
    const adminId = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Administrator';

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
  } catch (_err) {

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
  } catch (_err) {

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
  } catch (_err) {

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

  } catch (_error) {
      /* empty */

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
  } catch (_err) {

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
  } catch (_err) {

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
  } catch (_err) {

    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Add a holiday (Admin)
 */
export const addHoliday = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, date, type } = req.body as { name: string; date: string; type: string };

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
  } catch (_err) {

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
  } catch (_err) {

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
  } catch (_err) {

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
  } catch (_err) {

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
    const { month, year, employeeIds } = req.body as { month?: number; year?: number; employeeIds?: string[] };
    const authReq = req as AuthenticatedRequest;
    const processedBy = authReq.user ? String(authReq.user.employeeId || authReq.user.id) : 'Administrator';

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
  } catch (_err) {

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
  } catch (_err) {

    res.status(500).json({ message: 'Something went wrong!' });
  }
};


