import { db } from '../db/index.js';
import { holidays, leaveBalances, leaveLedger, lwopSummary, serviceRecords, tardinessSummary, leaveApplications, dailyTimeRecords, authentication, internalPolicies, pdsHrDetails, departments } from '../db/schema.js';
import { eq, and, between, ne, or, sql, desc, lt, lte, gte, getTableColumns } from 'drizzle-orm';
import { createNotification, notifyAdmins, updateNotificationsByReference } from './notificationController.js';
import { accrueCreditsForMonth } from '../services/leaveAccrualService.js';
import type { AuthenticatedHandler, AuthenticatedRequest } from '../types/index.js';
import { type PaymentStatus, type TransactionType, type ApplicationStatus, APPLICATION_STATUS } from '../types/leave.types.js';
import { applyLeaveSchema, rejectLeaveSchema, creditUpdateSchema, accrueCreditsSchema, leavePolicySchema, type LeavePolicyContentStrict } from '../schemas/leaveSchema.js';
import { formatFullName } from '../utils/nameUtils.js';
import { z } from 'zod';

// T1 FIX: Typed interface for multer request
interface MulterRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}

// T1 FIX: Typed record for leave update data
type LeaveUpdateData = Partial<{
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Processing' | 'Finalizing';
  updatedAt: ReturnType<typeof sql>;
  adminFormPath: string | null;
  finalAttachmentPath: string | null;
  rejectedBy: string | null;
  rejectedAt: ReturnType<typeof sql> | null;
  rejectionReason: string | null;
  approvedBy: string | null;
  approvedAt: ReturnType<typeof sql> | null;
}>;

// Type guard for application status
function isApplicationStatus(status: string): status is ApplicationStatus {
  return APPLICATION_STATUS.some(s => s === status);
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
  } catch (_error: unknown) {
    return [];
  }
};

const calculateWorkingDays = async (startDate: string, endDate: string): Promise<number> => {
  const holidaysList = await getHolidaysInRange(startDate, endDate);
  const holidaySet = new Set(holidaysList);

  let count = 0;
  const curDate = new Date(startDate);
  const end = new Date(endDate);

  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    const dateStr = curDate.toISOString().split('T')[0];

    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }

  return count;
};

const getCurrentYear = (): number => new Date().getFullYear();

const processDeemedApprovedLeaves = async (): Promise<void> => {
    try {
        const policy = await getLeavePolicy();
        if (!policy) return;

        const gracePeriod = policy.deemedApprovalGracePeriod || 5;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const pendingLeaves = await db.query.leaveApplications.findMany({
            where: eq(leaveApplications.status, 'Pending'),
        });

        if (pendingLeaves.length === 0) return;

        let oldestDate = today;
        for (const app of pendingLeaves) {
            const createdDate = new Date(app.createdAt || today);
            if (createdDate < oldestDate) oldestDate = createdDate;
        }
        
        const startDateStr = oldestDate.toISOString().split('T')[0];
        const holidaysInRange = await getHolidaysInRange(startDateStr, todayStr);
        const holidaySet = new Set(holidaysInRange);

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
            const createdDate = new Date(application.createdAt || today);
            const createdStr = createdDate.toISOString().split('T')[0];
            
            const workingDaysPassed = countWorkingDaysFast(createdStr, todayStr);

            if (workingDaysPassed >= gracePeriod) {
                const isSpecialLeave = policy.specialLeavesNoDeduction.includes(application.leaveType);
                let finalSafeDeduction = 0;

                if ((application.actualPaymentStatus === 'WITH_PAY' || application.actualPaymentStatus === 'PARTIAL') && !isSpecialLeave) {
                    const primaryCreditType = policy.leaveToCreditMap[application.leaveType] || 'Vacation Leave';
                    const deductionAmount = Number(application.workingDays);
                    
                    if (application.crossChargedFrom) {
                        const currentBalance = await getEmployeeBalance(application.employeeId, application.crossChargedFrom);
                        finalSafeDeduction = Math.min(deductionAmount, currentBalance);
                        if (finalSafeDeduction > 0) {
                            await updateBalance(application.employeeId, application.crossChargedFrom, -finalSafeDeduction, 'DEDUCTION', application.id, 'leave_application', `${application.leaveType} cross-charged (Deemed Approved)`, approvedBy);
                        }
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
                    finalSafeDeduction = Number(application.workingDays);
                }

                let finalPaymentStatus = application.actualPaymentStatus;
                if (!isSpecialLeave && application.actualPaymentStatus !== 'WITHOUT_PAY') {
                    if (finalSafeDeduction === Number(application.workingDays)) finalPaymentStatus = 'WITH_PAY';
                    else if (finalSafeDeduction > 0) finalPaymentStatus = 'PARTIAL';
                    else finalPaymentStatus = 'WITHOUT_PAY';
                }

                const finalWithoutPay = Number(application.workingDays) - finalSafeDeduction;

                if (application.actualPaymentStatus === 'WITHOUT_PAY') {
                    await updateLWOPSummary(application.employeeId, Number(application.workingDays));
                }

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

                const eventType: 'LWOP' | 'Leave' = Number(finalWithoutPay) > 0 ? 'LWOP' : 'Leave';
                await logToServiceRecord(
                  application.employeeId, 
                  eventType, 
                  String(application.startDate).split('T')[0], 
                  String(application.endDate).split('T')[0], 
                  application.leaveType, 
                  Number(application.workingDays), 
                  application.actualPaymentStatus !== 'WITHOUT_PAY', 
                  `${application.leaveType} - Deemed Approved`, 
                  application.id, 
                  'leave_application', 
                  approvedBy
                );
            }
        }
    } catch (error) {
      console.error('[LEAVE] Error processing deemed approved leaves:', error);
    }
};

const getLeavePolicy = async (): Promise<LeavePolicyContentStrict> => {
    try {
        const results = await db.select()
        .from(internalPolicies)
        .where(eq(internalPolicies.category, 'leave'))
        .limit(1);

        const policy = results[0];
        if (!policy) {
            throw new Error('Leave policy not found in database.');
        }

        const rawJson: unknown = typeof policy.content === 'string' 
            ? JSON.parse(policy.content) 
            : policy.content;
            
        return leavePolicySchema.parse(rawJson);
    } catch (error) {
        console.error('getLeavePolicy error:', error);
        throw error;
    }
};

const getEmployeeBalance = async (
  employeeId: string,
  creditType: string,
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

const updateBalance = async (
  employeeId: string,
  creditType: string,
  amount: number,
  transactionType: TransactionType,
  referenceId?: number,
  referenceType?: 'leave_application' | 'monetization' | 'dtr' | 'manual',
  remarks?: string,
  createdBy?: string
): Promise<{ success: boolean; newBalance: number }> => {
  const year = getCurrentYear();

  try {
    const currentBalance = await getEmployeeBalance(employeeId, creditType, year);
    const newBalanceValue = Number((currentBalance + amount).toFixed(3));
    const newBalanceStr = newBalanceValue.toString();

    await db.insert(leaveBalances).values({
      employeeId,
      creditType,
      balance: newBalanceStr,
      year
    }).onDuplicateKeyUpdate({
      set: {
        balance: newBalanceStr,
        updatedAt: sql`CURRENT_TIMESTAMP`
      }
    });

    await db.insert(leaveLedger).values({
      employeeId,
      creditType,
      transactionType,
      amount: amount.toString(),
      balanceAfter: newBalanceStr,
      referenceId,
      referenceType,
      remarks,
      createdBy: createdBy || 'System'
    });

    return { success: true, newBalance: newBalanceValue };
  } catch (_error) {
    return { success: false, newBalance: 0 };
  }
};

const updateLWOPSummary = async (employeeId: string, lwopDays: number): Promise<void> => {
  const year = getCurrentYear();

  try {
    const prevRow = await db.query.lwopSummary.findFirst({
      where: and(
        eq(lwopSummary.employeeId, employeeId),
        lt(lwopSummary.year, year)
      ),
      orderBy: [desc(lwopSummary.year)]
    });

    const prevCumulative = prevRow ? Number(prevRow.cumulativeLwopDays) : 0;
    const totalDaysStr = lwopDays.toString();
    const cumulativeDaysStr = (prevCumulative + lwopDays).toString();

    await db.insert(lwopSummary).values({
      employeeId,
      year,
      totalLwopDays: totalDaysStr,
      cumulativeLwopDays: cumulativeDaysStr
    }).onDuplicateKeyUpdate({
      set: {
        totalLwopDays: sql`total_lwop_days + ${totalDaysStr}`,
        cumulativeLwopDays: sql`cumulative_lwop_days + ${totalDaysStr}`,
        updatedAt: sql`CURRENT_TIMESTAMP`
      }
    });
  } catch (_error) {
      /* empty */
  }
};

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
      isWithPay: !!isWithPay,
      remarks,
      referenceId,
      referenceType,
      processedBy
    });
  } catch (_error) {
      /* empty */
  }
};

const calculateTardinessDeduction = async (
  employeeId: string,
  year: number,
  month: number
): Promise<{ daysEquivalent: number; deductedFromVL: number; chargedAsLWOP: number }> => {
  try {
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

    const empRecord = await db.select({ dailyTargetHours: pdsHrDetails.dailyTargetHours })
      .from(pdsHrDetails)
      .innerJoin(authentication, eq(pdsHrDetails.employeeId, authentication.id))
      .where(eq(authentication.employeeId, employeeId))
      .limit(1);
    const dailyTargetMinutes = (Number(empRecord[0]?.dailyTargetHours) || 8) * 60;

    const totalMinutes = (tardiness.totalLateMinutes || 0) + (tardiness.totalUndertimeMinutes || 0);
    const daysEquivalent = totalMinutes / dailyTargetMinutes;

    if (daysEquivalent <= 0) {
      return { daysEquivalent: 0, deductedFromVL: 0, chargedAsLWOP: 0 };
    }

    const vlBalance = await getEmployeeBalance(employeeId, 'Vacation Leave', year);
    
    let deductedFromVL = 0;
    let chargedAsLWOP = 0;

    if (vlBalance >= daysEquivalent) {
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
      await updateLWOPSummary(employeeId, chargedAsLWOP);
    } else {
      chargedAsLWOP = daysEquivalent;
      await updateLWOPSummary(employeeId, chargedAsLWOP);
    }

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

export const applyLeave: AuthenticatedHandler = async (req, res) => {
  const multerReq = req as unknown as MulterRequest;
  try {
    const employeeId = req.user.employeeId || String(req.user.id);
    if (!employeeId) {
      res.status(400).json({ message: 'User not identified.' });
      return;
    }

    const policy = await getLeavePolicy();
    if (!policy) {
      res.status(500).json({ message: 'Internal Error: Leave policy not configured.' });
      return;
    }

    const validation = applyLeaveSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Validation Error', errors: validation.error.format() });
      return;
    }

    const { leaveType, startDate, endDate, reason, isWithPay } = validation.data;

    if (!policy.types.includes(leaveType)) {
      res.status(400).json({ message: `Invalid leave type: ${leaveType}.` });
      return;
    }

    const workingDays = await calculateWorkingDays(startDate, endDate);
    if (workingDays === 0) {
      res.status(400).json({ message: 'Leave duration is 0 working days.' });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const advanceFiling = policy.advanceFilingDays;
    if (advanceFiling.appliesTo.includes(leaveType)) {
      const workingDaysAdvance = await calculateWorkingDays(todayStr, startDate);
      if (workingDaysAdvance <= advanceFiling.days) {
        res.status(400).json({ message: `${leaveType} must be filed at least ${advanceFiling.days} working days in advance.` });
        return;
      }
    }

    if (leaveType === (policy.sickLeaveType || 'Sick Leave')) {
      const workingDaysPassed = await calculateWorkingDays(endDate, todayStr);
      const window = policy.sickLeaveWindow.maxDaysAfterReturn;
      if (workingDaysPassed > window + 1) {
        res.status(400).json({ message: `Sick Leave must be filed within ${window} working days upon returning.` });
        return;
      }
    }

    const annualLimit = policy.annualLimits[leaveType];
    if (annualLimit !== undefined) {
      const year = new Date(startDate).getFullYear();
      const usageResult = await db.select({ totalDays: sql<string>`sum(${leaveApplications.workingDays})` })
      .from(leaveApplications)
      .where(and(
        eq(leaveApplications.employeeId, employeeId),
        eq(leaveApplications.leaveType, leaveType),
        sql`YEAR(${leaveApplications.startDate}) = ${year}`,
        ne(leaveApplications.status, 'Rejected'),
        ne(leaveApplications.status, 'Cancelled')
      ));
      
      const usedDays = Number(usageResult[0]?.totalDays || 0);
      if (usedDays + workingDays > annualLimit) {
        res.status(400).json({ message: `Annual limit of ${annualLimit} days for ${leaveType} exceeded.` });
        return;
      }
    }

    const isSpecialLeave = policy.specialLeavesNoDeduction.includes(leaveType);
    let actualPaymentStatus: PaymentStatus = 'WITH_PAY';
    let daysWithPay = 0;
    let daysWithoutPay = 0;
    let crossChargedFrom: string | null = null;

    if (isWithPay && !isSpecialLeave) {
      const primaryCreditType = policy.leaveToCreditMap[leaveType];
      if (!primaryCreditType) {
        res.status(400).json({ message: `Leave type ${leaveType} not linked to any credit type.` });
        return;
      }

      const primaryBalance = await getEmployeeBalance(employeeId, primaryCreditType);
      if (primaryBalance >= workingDays) {
        daysWithPay = workingDays;
        actualPaymentStatus = 'WITH_PAY';
      } else {
        daysWithPay = primaryBalance;
        const crossChargeType = policy.crossChargeMap[leaveType];
        if (crossChargeType) {
          const crossBalance = await getEmployeeBalance(employeeId, crossChargeType);
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
      }
    } else if (!isWithPay) {
      daysWithoutPay = workingDays;
      actualPaymentStatus = 'WITHOUT_PAY';
    } else if (isSpecialLeave) {
      daysWithPay = workingDays;
      actualPaymentStatus = 'WITH_PAY';
    }

    const [result] = await db.insert(leaveApplications).values({
      employeeId: employeeId,
      leaveType,
      startDate,
      endDate,
      workingDays: workingDays.toString(),
      isWithPay: !!isWithPay,
      actualPaymentStatus,
      daysWithPay: daysWithPay.toString(),
      daysWithoutPay: daysWithoutPay.toString(),
      crossChargedFrom,
      reason,
      attachmentPath: multerReq.file?.filename || null,
      status: 'Pending'
    });

    try {
      const userRole = req.user.role;
      const isAdminOrHR = userRole === 'Administrator' || userRole === 'Human Resource';

      await notifyAdmins({
        senderId: employeeId,
        title: 'New Leave Request',
        message: `Employee ${employeeId} requested ${leaveType}.`,
        type: 'leave_request',
        referenceId: result.insertId,
        excludeId: employeeId
      });

      await createNotification({
        recipientId: employeeId,
        senderId: isAdminOrHR ? employeeId : null,
        title: 'Leave Request Submitted',
        message: `Your ${leaveType} request has been submitted.`,
        type: 'leave_request',
        referenceId: result.insertId,
      });
    } catch (_notifyError) { /* empty */ }

    res.status(201).json({
      message: 'Leave application submitted successfully',
      id: result.insertId,
      workingDays,
      actualPaymentStatus
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};

export const getMyLeaves: AuthenticatedHandler = async (req, res) => {
  try {
    const employeeId = req.user.employeeId || String(req.user.id);
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = parseInt(String(req.query.limit || '10'), 10) || 10;
    const search = String(req.query.search || '');
    const statusParam = req.query.status;
    const offset = (page - 1) * limit;

    const conditions = [eq(leaveApplications.employeeId, employeeId)];
    if (search) {
      conditions.push(or(
        sql`${leaveApplications.leaveType} LIKE ${`%${search}%`}`,
        sql`${leaveApplications.reason} LIKE ${`%${search}%`}`
      )!);
    }
    if (typeof statusParam === 'string' && isApplicationStatus(statusParam)) {
      conditions.push(eq(leaveApplications.status, statusParam));
    }

    const where = and(...conditions);
    const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(leaveApplications).where(where);
    const totalItems = Number(countResult?.total || 0);

    const leaves = await db.select({
      ...getTableColumns(leaveApplications),
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      department: departments.name
    })
    .from(leaveApplications)
    .leftJoin(authentication, eq(leaveApplications.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
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
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    });
  } catch (_err: unknown) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const getAllLeaves: AuthenticatedHandler = async (req, res) => {
  try {
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = parseInt(String(req.query.limit || '10'), 10) || 10;
    const search = String(req.query.search || '');
    const department = String(req.query.department || '');
    const statusParam = req.query.status;
    const offset = (page - 1) * limit;

    await processDeemedApprovedLeaves();

    const conditions = [];
    if (search) {
      conditions.push(or(
        sql`${leaveApplications.leaveType} LIKE ${`%${search}%`}`,
        sql`${authentication.firstName} LIKE ${`%${search}%`}`,
        sql`${authentication.lastName} LIKE ${`%${search}%`}`
      )!);
    }
    if (department) conditions.push(eq(departments.name, department));
    if (typeof statusParam === 'string' && isApplicationStatus(statusParam)) {
      conditions.push(eq(leaveApplications.status, statusParam));
    }
    
    const startDate = String(req.query.startDate || '');
    const endDate = String(req.query.endDate || '');
    const employeeId = String(req.query.employeeId || '');

    if (startDate && endDate) {
      conditions.push(and(lte(leaveApplications.startDate, endDate), gte(leaveApplications.endDate, startDate))); 
    }
    if (employeeId) {
       conditions.push(or(
         eq(leaveApplications.employeeId, employeeId),
         sql`${authentication.firstName} LIKE ${`%${employeeId}%`}`,
         sql`${authentication.lastName} LIKE ${`%${employeeId}%`}`
       )!);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [countResult] = await db.select({ total: sql<number>`count(*)` })
      .from(leaveApplications)
      .leftJoin(authentication, eq(leaveApplications.employeeId, authentication.employeeId))
      .where(where);
    const totalItems = Number(countResult?.total || 0);

    const leaves = await db.select({
      ...getTableColumns(leaveApplications),
      firstName: sql<string>`COALESCE(${authentication.firstName}, '')`,
      lastName: sql<string>`COALESCE(${authentication.lastName}, '')`,
      middleName: authentication.middleName,
      suffix: authentication.suffix,
      department: sql<string>`COALESCE(${departments.name}, 'N/A')`,
      currentBalance: sql<number>`COALESCE(${leaveBalances.balance}, 0)`
    })
    .from(leaveApplications)
    .leftJoin(authentication, eq(leaveApplications.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .leftJoin(leaveBalances, and(
      eq(leaveBalances.employeeId, leaveApplications.employeeId),
      eq(leaveBalances.creditType, leaveApplications.leaveType),
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
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    });
  } catch (_err: unknown) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const processLeave: AuthenticatedHandler = async (req, res) => {
  const multerReq = req as unknown as MulterRequest;
  try {
    const idParam = typeof req.params.id === 'string' ? req.params.id : '';
    if (!idParam) {
      res.status(400).json({ message: 'Missing application ID' });
      return;
    }
    const id = parseInt(idParam, 10);
    const file = multerReq.file;
    const updateData: LeaveUpdateData = { status: 'Processing', updatedAt: sql`CURRENT_TIMESTAMP` };
    if (file) updateData.adminFormPath = file.filename;

    await db.update(leaveApplications).set(updateData).where(eq(leaveApplications.id, id));
    await updateNotificationsByReference({
        type: 'leave_request',
        referenceId: id,
        title: 'Leave Request Processing',
        message: 'Your leave request is being processed.',
        newType: 'leave_process',
    });
    res.status(200).json({ message: 'Leave processed' });
  } catch (_err: unknown) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const finalizeLeave: AuthenticatedHandler = async (req, res) => {
  const multerReq = req as unknown as MulterRequest;
  try {
    const idParam = typeof req.params.id === 'string' ? req.params.id : '';
    if (!idParam) {
      res.status(400).json({ message: 'Missing application ID' });
      return;
    }
    const id = parseInt(idParam, 10);
    const file = multerReq.file;
    const updateData: LeaveUpdateData = { status: 'Finalizing', updatedAt: sql`CURRENT_TIMESTAMP` };
    if (file) updateData.finalAttachmentPath = file.filename;

    await db.update(leaveApplications).set(updateData).where(eq(leaveApplications.id, id));
    await updateNotificationsByReference({
        type: ['leave_request', 'leave_process'],
        referenceId: id,
        title: 'Leave Request Finalizing',
        message: 'Your leave request is in the final stage of approval.',
        newType: 'leave_finalize',
    });
    res.status(200).json({ message: 'Leave finalized' });
  } catch (_err: unknown) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const approveLeave: AuthenticatedHandler = async (req, res) => {
  try {
    const idParam = typeof req.params.id === 'string' ? req.params.id : '';
    if (!idParam) {
      res.status(400).json({ message: 'Missing application ID' });
      return;
    }
    const appId = parseInt(idParam, 10);
    const adminId = String(req.user.employeeId || req.user.id);

    const application = await db.query.leaveApplications.findFirst({ where: eq(leaveApplications.id, appId) });
    if (!application) {
      res.status(404).json({ message: 'Leave application not found.' });
      return;
    }

    if (application.actualPaymentStatus === 'WITH_PAY' || application.actualPaymentStatus === 'PARTIAL') {
      const policy = await getLeavePolicy();
      const year = new Date(application.startDate).getFullYear();
      const daysWithPayVal = Number(application.daysWithPay);
      const primaryCreditType = policy.leaveToCreditMap[application.leaveType];

      if (primaryCreditType && daysWithPayVal > 0) {
        const primaryBalance = await getEmployeeBalance(application.employeeId, primaryCreditType, year);
        const deductionAmount = Math.min(daysWithPayVal, primaryBalance);
        if (deductionAmount > 0) {
          await updateBalance(application.employeeId, primaryCreditType, -deductionAmount, 'DEDUCTION', appId, 'leave_application', `Approved ${application.leaveType}`, adminId);
        }
        if (application.crossChargedFrom && daysWithPayVal > deductionAmount) {
          const crossDeduction = Math.min(daysWithPayVal - deductionAmount, await getEmployeeBalance(application.employeeId, application.crossChargedFrom, year));
          if (crossDeduction > 0) {
            await updateBalance(application.employeeId, application.crossChargedFrom, -crossDeduction, 'DEDUCTION', appId, 'leave_application', `Approved ${application.leaveType} (cross-charged)`, adminId);
          }
        }
      }
    }

    await db.update(leaveApplications).set({ status: 'Approved', approvedBy: adminId, approvedAt: sql`CURRENT_TIMESTAMP`, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(leaveApplications.id, appId));
    const eventType: 'LWOP' | 'Leave' = application.leaveType.includes('Without Pay') ? 'LWOP' : 'Leave';
    await logToServiceRecord(application.employeeId, eventType, application.startDate, application.endDate, application.leaveType, Number(application.workingDays), !!application.isWithPay, `Approved ${application.leaveType}`, appId, 'leave_application', adminId);

    if (Number(application.daysWithoutPay) > 0) {
      await updateLWOPSummary(application.employeeId, Number(application.daysWithoutPay));
    }

    await updateNotificationsByReference({
        type: ['leave_request', 'leave_process', 'leave_finalize'],
        referenceId: appId,
        title: 'Leave Request Approved',
        message: 'Your leave request has been approved.',
        newType: 'leave_approval'
    });
    res.status(200).json({ message: 'Leave approved' });
  } catch (_err: unknown) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const rejectLeave: AuthenticatedHandler = async (req, res) => {
  try {
    const idParam = typeof req.params.id === 'string' ? req.params.id : '';
    if (!idParam) {
      res.status(400).json({ message: 'Missing application ID' });
      return;
    }
    const appId = parseInt(idParam, 10);
    const adminId = String(req.user.employeeId || req.user.id);

    const validation = rejectLeaveSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Validation Error', errors: validation.error.format() });
      return;
    }
    const { reason } = validation.data;

    await db.update(leaveApplications).set({ 
      status: 'Rejected', 
      rejectedBy: adminId, 
      rejectedAt: sql`CURRENT_TIMESTAMP`, 
      rejectionReason: reason, 
      updatedAt: sql`CURRENT_TIMESTAMP` 
    }).where(eq(leaveApplications.id, appId));

    await updateNotificationsByReference({
        type: ['leave_request', 'leave_process', 'leave_finalize'],
        referenceId: appId,
        title: 'Leave Request Rejected',
        message: `Rejected. Reason: ${reason}`,
        newType: 'leave_rejection'
    });
    res.status(200).json({ message: 'Leave rejected' });
  } catch (_err: unknown) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const getHolidays: AuthenticatedHandler = async (req, res) => {
  try {
    const year = parseInt(String(req.query.year || ''), 10) || getCurrentYear();
    const rows = await db.select().from(holidays).where(eq(sql`YEAR(${holidays.date})`, year));
    res.status(200).json({ holidays: rows, year });
  } catch (_err) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const addHoliday: AuthenticatedHandler = async (req, res) => {
  try {
    const { name, date, type } = req.body;
    const year = new Date(date).getFullYear();
    await db.insert(holidays).values({ name, date, type, year });
    res.status(201).json({ message: 'Holiday added' });
  } catch (_err) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const deleteHoliday: AuthenticatedHandler = async (req, res) => {
  try {
    const idParam = typeof req.params.id === 'string' ? req.params.id : '';
    if (!idParam) {
      res.status(400).json({ message: 'Missing holiday ID' });
      return;
    }
    await db.delete(holidays).where(eq(holidays.id, parseInt(idParam, 10)));
    res.status(200).json({ message: 'Holiday deleted' });
  } catch (_err) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const getLWOPSummary: AuthenticatedHandler = async (req, res) => {
  try {
    const employeeId = typeof req.params.employeeId === 'string' ? req.params.employeeId : '';
    if (!employeeId) {
      res.status(400).json({ message: 'Missing employee ID' });
      return;
    }
    const rows = await db.select().from(lwopSummary).where(eq(lwopSummary.employeeId, employeeId));
    res.status(200).json(rows);
  } catch (_err) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const deleteEmployeeCredit: AuthenticatedHandler = async (req, res) => {
  try {
    const idParam = typeof req.params.id === 'string' ? req.params.id : '';
    if (!idParam) {
      res.status(400).json({ message: 'Missing credit ID' });
      return;
    }
    await db.delete(leaveBalances).where(eq(leaveBalances.id, parseInt(idParam, 10)));
    res.status(200).json({ message: 'Credit deleted' });
  } catch (_err) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const getMyCredits: AuthenticatedHandler = async (req, res) => {
  try {
    const employeeId = req.user.employeeId || String(req.user.id);
    const year = parseInt(String(req.query.year || ''), 10) || getCurrentYear();

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
      department: departments.name
    })
    .from(leaveBalances)
    .leftJoin(authentication, eq(leaveBalances.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, year)));

    res.status(200).json({ 
      credits: credits.map(c => ({ ...c, employeeName: formatFullName(c.lastName, c.firstName, c.middleName, c.suffix) })), 
      year 
    });
  } catch (_err) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const getEmployeeCredits: AuthenticatedHandler = async (req, res) => {
  try {
    const employeeId = typeof req.params.employeeId === 'string' ? req.params.employeeId : '';
    if (!employeeId) {
      res.status(400).json({ message: 'Missing employee ID' });
      return;
    }
    const year = parseInt(String(req.query.year || ''), 10) || getCurrentYear();

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
      department: departments.name
    })
    .from(leaveBalances)
    .leftJoin(authentication, eq(leaveBalances.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .where(and(eq(leaveBalances.employeeId, employeeId), eq(leaveBalances.year, year)));

    res.status(200).json({ 
      credits: credits.map(c => ({ ...c, employeeName: formatFullName(c.lastName, c.firstName, c.middleName, c.suffix) })), 
      year 
    });
  } catch (_err) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const getAllEmployeeCredits: AuthenticatedHandler = async (req, res) => {
  try {
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = parseInt(String(req.query.limit || '10'), 10) || 10;
    const search = String(req.query.search || '');
    const year = parseInt(String(req.query.year || ''), 10) || getCurrentYear();
    const offset = (page - 1) * limit;

    const conditions = [eq(leaveBalances.year, year)];
    if (search) {
      conditions.push(or(
        sql`COALESCE(${authentication.firstName}, '') LIKE ${`%${search}%`}`,
        sql`COALESCE(${authentication.lastName}, '') LIKE ${`%${search}%`}`,
        sql`COALESCE(${leaveBalances.employeeId}, '') LIKE ${`%${search}%`}`
      )!);
    }

    const where = and(...conditions);
    const [countResult] = await db.select({ total: sql<number>`count(*)` })
      .from(leaveBalances)
      .leftJoin(authentication, eq(leaveBalances.employeeId, authentication.employeeId))
      .where(where);
    const totalItems = Number(countResult?.total || 0);

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
      department: sql<string>`COALESCE(${departments.name}, 'N/A')`,
      daysUsedWithPay: sql<number>`(
        SELECT COALESCE(ABS(SUM(ll.amount)), 0) FROM ${leaveLedger} ll 
        WHERE ll.employee_id = ${leaveBalances.employeeId} AND ll.credit_type = ${leaveBalances.creditType} AND ll.transaction_type = 'DEDUCTION' AND YEAR(ll.created_at) = ${year}
      )`,
      daysUsedWithoutPay: sql<number>`(
        SELECT COALESCE(SUM(la.days_without_pay), 0) FROM ${leaveApplications} la 
        WHERE la.employee_id = ${leaveBalances.employeeId} AND la.leave_type = ${leaveBalances.creditType} AND la.status = 'Approved' AND YEAR(la.start_date) = ${year}
      )`
    })
    .from(leaveBalances)
    .leftJoin(authentication, eq(leaveBalances.employeeId, authentication.employeeId))
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
    .where(where)
    .orderBy(authentication.lastName, authentication.firstName)
    .limit(limit)
    .offset(offset);

    res.status(200).json({
      credits: credits.map(c => ({ ...c, employeeName: formatFullName(c.lastName, c.firstName, c.middleName, c.suffix) })),
      year,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    });
  } catch (_err: unknown) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const updateEmployeeCredit: AuthenticatedHandler = async (req, res) => {
  try {
    const employeeId = typeof req.params.employeeId === 'string' ? req.params.employeeId : '';
    if (!employeeId) {
      res.status(400).json({ message: 'Missing employee ID' });
      return;
    }
    const adminId = String(req.user.employeeId || req.user.id);
    const validation = creditUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Validation Error', errors: validation.error.format() });
      return;
    }

    const { creditType, balance, remarks } = validation.data;
    const year = getCurrentYear();
    const currentBalance = await getEmployeeBalance(employeeId, creditType, year);
    const result = await updateBalance(employeeId, creditType, balance - currentBalance, 'ADJUSTMENT', undefined, 'manual', remarks || 'Admin adjustment', adminId);

    if (result.success) {
      res.status(200).json({ message: 'Credit updated', previousBalance: currentBalance, newBalance: result.newBalance });
    } else {
      res.status(500).json({ message: 'Failed to update credit' });
    }
  } catch (_err: unknown) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const accrueMonthlyCredits: AuthenticatedHandler = async (req, res) => {
  try {
    const validation = accrueCreditsSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Validation Error', errors: validation.error.format() });
      return;
    }
    const { month, year, employeeIds } = validation.data;
    const result = await accrueCreditsForMonth(month, year, employeeIds);
    res.status(200).json({ message: `Accrued for ${result.processedCount} employees`, details: result });
  } catch (_err: unknown) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

/**
 * Allocate default credits for new employee
 */
export const allocateDefaultCredits = async (employeeId: string): Promise<void> => {
  try {
    const policy = await getLeavePolicy();
    const defaults = Object.entries(policy.initialAllocations || {}).map(([type, balance]) => ({
      type: type,
      balance: Number(balance)
    }));

    for (const credit of defaults) {
      const year = getCurrentYear();
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
  } catch (_error: unknown) {
      /* empty */
  }
};

export const getMyLedger: AuthenticatedHandler = async (req, res) => {
  try {
    const employeeId = req.user.employeeId || String(req.user.id);
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = parseInt(String(req.query.limit || '20'), 10) || 20;
    const creditType = String(req.query.creditType || '');
    const offset = (page - 1) * limit;

    const conditions = [eq(leaveLedger.employeeId, employeeId)];
    if (creditType) conditions.push(eq(leaveLedger.creditType, creditType));

    const where = and(...conditions);
    const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(leaveLedger).where(where);
    const totalItems = Number(countResult?.total || 0);

    const entries = await db.select().from(leaveLedger).where(where).orderBy(desc(leaveLedger.createdAt)).limit(limit).offset(offset);
    res.status(200).json({ entries, pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) } });
  } catch (_err: unknown) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const getEmployeeLedger: AuthenticatedHandler = async (req, res) => {
  try {
    const employeeId = typeof req.params.employeeId === 'string' ? req.params.employeeId : '';
    if (!employeeId) {
      res.status(400).json({ message: 'Missing employee ID' });
      return;
    }
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = parseInt(String(req.query.limit || '20'), 10) || 20;
    const creditType = String(req.query.creditType || '');
    const offset = (page - 1) * limit;

    const conditions = [eq(leaveLedger.employeeId, employeeId)];
    if (creditType) conditions.push(eq(leaveLedger.creditType, creditType));

    const where = and(...conditions);
    const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(leaveLedger).where(where);
    const totalItems = Number(countResult?.total || 0);

    const entries = await db.select().from(leaveLedger).where(where).orderBy(desc(leaveLedger.createdAt)).limit(limit).offset(offset);
    res.status(200).json({ entries, pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) } });
  } catch (_err: unknown) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const processMonthlyTardiness: AuthenticatedHandler = async (req, res) => {
  try {
    const bodySchema = z.object({
      month: z.number().optional(),
      year: z.number().optional(),
      employeeIds: z.array(z.string()).optional()
    });
    
    const { month, year, employeeIds } = bodySchema.parse(req.body);
    const targetMonth = month ?? new Date().getMonth();
    const targetYear = year ?? new Date().getFullYear();

    const conditions = [eq(tardinessSummary.year, targetYear), eq(tardinessSummary.month, targetMonth), sql`processed_at IS NULL` ];
    if (employeeIds && employeeIds.length > 0) {
      conditions.push(sql`${tardinessSummary.employeeId} IN (${employeeIds})`);
    }

    const employees = await db.select({ employeeId: tardinessSummary.employeeId }).from(tardinessSummary).where(and(...conditions));
    const results = [];
    for (const emp of employees) {
      const result = await calculateTardinessDeduction(emp.employeeId, targetYear, targetMonth);
      if (result.daysEquivalent > 0) results.push({ employeeId: emp.employeeId, ...result });
    }
    res.status(200).json({ message: `Processed for ${results.length} employees`, results });
  } catch (_err: unknown) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const getServiceRecord: AuthenticatedHandler = async (req, res) => {
  try {
    const employeeId = typeof req.params.employeeId === 'string' ? req.params.employeeId : '';
    if (!employeeId) {
      res.status(400).json({ message: 'Missing employee ID' });
      return;
    }
    const records = await db.select().from(serviceRecords).where(eq(serviceRecords.employeeId, employeeId)).orderBy(desc(serviceRecords.eventDate));
    const [lwopTotal] = await db.select({ totalLwopDays: sql<number>`SUM(${serviceRecords.daysCount})` }).from(serviceRecords).where(and(eq(serviceRecords.employeeId, employeeId), eq(serviceRecords.eventType, 'LWOP')));
    res.status(200).json({ records, totalLWOPDays: Number(lwopTotal?.totalLwopDays || 0) });
  } catch (_err: unknown) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const getTotalLWOPForRetirement: AuthenticatedHandler = async (req, res) => {
  try {
    const employeeId = typeof req.params.employeeId === 'string' ? req.params.employeeId : '';
    if (!employeeId) {
      res.status(400).json({ message: 'Missing employee ID' });
      return;
    }
    const [lwopTotalSum] = await db.select({ maxCumulative: sql<number>`MAX(${lwopSummary.cumulativeLwopDays})` }).from(lwopSummary).where(eq(lwopSummary.employeeId, employeeId));
    const [serviceRecordsTotal] = await db.select({ serviceRecordLwop: sql<number>`SUM(${serviceRecords.daysCount})` }).from(serviceRecords).where(and(eq(serviceRecords.employeeId, employeeId), eq(serviceRecords.eventType, 'LWOP')));
    const totalDays = Math.max(Number(lwopTotalSum?.maxCumulative || 0), Number(serviceRecordsTotal?.serviceRecordLwop || 0));
    const yearsExtension = Math.floor(totalDays / 365);
    res.status(200).json({ employeeId, totalLWOPDays: totalDays, retirementImpact: { yearsExtension, remainingDays: totalDays % 365 } });
  } catch (_err: unknown) {
    res.status(500).json({ message: 'Something went wrong!' });
  }
};
