import { db } from '../db/index.js';
import { 
    holidays, 
    leaveBalances, 
    leaveLedger, 
    lwopSummary, 
    serviceRecords, 
    tardinessSummary, 
    leaveApplications, 
    dailyTimeRecords, 
    authentication, 
    pdsHrDetails, 
    departments 
} from '../db/schema.js';
import { eq, and, ne, or, sql, desc, lte, gte, getTableColumns, like } from 'drizzle-orm';
import { createNotification, notifyAdmins, updateNotificationsByReference } from './notificationController.js';
import { accrueCreditsForMonth } from '../services/leaveAccrualService.js';
import * as leaveService from '../services/leaveService.js';
import type { AuthenticatedHandler, AuthenticatedRequest } from '../types/index.js';
import { type PaymentStatus, type ApplicationStatus, APPLICATION_STATUS } from '../types/leave.types.js';
import { 
    applyLeaveSchema, 
    rejectLeaveSchema, 
    approveLeaveSchema, 
    creditUpdateSchema, 
    accrueCreditsSchema, 
} from '../schemas/leaveSchema.js';
import { formatFullName } from '../utils/nameUtils.js';
import { normalizeToIsoDate } from '../utils/dateUtils.js';
import { z } from 'zod';

// T1 FIX: Typed interface for multer request
interface MulterRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}

// Alignment Fix: Strictly typed leave update data
type LeaveUpdateData = Partial<{
  status: ApplicationStatus;
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

const getCurrentYear = (): number => new Date().getFullYear();

const processDeemedApprovedLeaves = async (): Promise<void> => {
    try {
        const policy = await leaveService.getLeavePolicy();
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
        
        const approvedBy = 'SYSTEM (Deemed Approved)';

        for (const application of pendingLeaves) {
            const createdDate = new Date(application.createdAt || today);
            const createdStr = createdDate.toISOString().split('T')[0];
            
            const workingDaysPassed = await leaveService.calculateWorkingDays(createdStr, todayStr);

            if (workingDaysPassed >= gracePeriod) {
                const isSpecialLeave = policy.specialLeavesNoDeduction.includes(application.leaveType);
                let finalSafeDeduction = 0;
                const year = new Date(application.startDate).getFullYear();

                if ((application.actualPaymentStatus === 'WITH_PAY' || application.actualPaymentStatus === 'PARTIAL') && !isSpecialLeave) {
                    const primaryCreditType = policy.leaveToCreditMap[application.leaveType] || 'Vacation Leave';
                    const deductionAmount = Number(application.workingDays);
                    
                    if (application.crossChargedFrom) {
                        const currentBalance = await leaveService.getEmployeeBalance(application.employeeId, application.crossChargedFrom, year);
                        finalSafeDeduction = Math.min(deductionAmount, currentBalance);
                        if (finalSafeDeduction > 0) {
                            await leaveService.updateBalance(application.employeeId, application.crossChargedFrom, -finalSafeDeduction, 'DEDUCTION', application.id, 'leave_application', `${application.leaveType} cross-charged (Deemed Approved)`, approvedBy);
                        }
                        const remainder = deductionAmount - finalSafeDeduction;
                        if (remainder > 0) {
                            await leaveService.updateLWOPSummary(application.employeeId, remainder, year);
                        }
                    } else {
                        const currentBalance = await leaveService.getEmployeeBalance(application.employeeId, primaryCreditType, year);
                        finalSafeDeduction = Math.min(deductionAmount, currentBalance);
                        if (finalSafeDeduction > 0) {
                            await leaveService.updateBalance(application.employeeId, primaryCreditType, -finalSafeDeduction, 'DEDUCTION', application.id, 'leave_application', `${application.leaveType} (Deemed Approved)`, approvedBy);
                        }
                        const remainder = deductionAmount - finalSafeDeduction;
                        if (remainder > 0) {
                            await leaveService.updateLWOPSummary(application.employeeId, remainder, year);
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
                    await leaveService.updateLWOPSummary(application.employeeId, Number(application.workingDays), year);
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
                await leaveService.logToServiceRecord(
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

    const vlBalance = await leaveService.getEmployeeBalance(employeeId, 'Vacation Leave', year);
    
    let deductedFromVL = 0;
    let chargedAsLWOP = 0;

    if (vlBalance >= daysEquivalent) {
      deductedFromVL = daysEquivalent;
      await leaveService.updateBalance(
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
      await leaveService.updateBalance(
        employeeId,
        'Vacation Leave',
        -vlBalance,
        'TARDINESS_DEDUCTION',
        undefined,
        'dtr',
        `Tardiness/Undertime deduction for ${month}/${year} (partial)`,
        'SYSTEM'
      );
      await leaveService.updateLWOPSummary(employeeId, chargedAsLWOP, year);
    } else {
      chargedAsLWOP = daysEquivalent;
      await leaveService.updateLWOPSummary(employeeId, chargedAsLWOP, year);
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
  } catch (error) {
    console.error('[LEAVE] calculateTardinessDeduction error:', error);
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

    const policy = await leaveService.getLeavePolicy();
    if (!policy) {
      res.status(500).json({ message: 'Internal Error: Leave policy not configured.' });
      return;
    }

    const validation = applyLeaveSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Validation Error', errors: validation.error.format() });
      return;
    }

    const { leaveType, startDate, endDate, reason, isWithPay, isHalfDay } = validation.data;

    if (!policy.types.includes(leaveType)) {
      res.status(400).json({ message: `Invalid leave type: ${leaveType}.` });
      return;
    }

    let workingDays = await leaveService.calculateWorkingDays(startDate, endDate);
    if (isHalfDay) {
        if (startDate === endDate) {
            workingDays = 0.5;
        } else {
            workingDays = Math.max(0, workingDays - 0.5);
        }
    }

    if (workingDays === 0) {
      res.status(400).json({ message: 'Leave duration is 0 working days.' });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const advanceFiling = policy.advanceFilingDays;
    if (advanceFiling.appliesTo.includes(leaveType)) {
      const workingDaysAdvance = await leaveService.calculateWorkingDays(todayStr, startDate);
      if (workingDaysAdvance < advanceFiling.days) {
        res.status(400).json({ message: `${leaveType} must be filed at least ${advanceFiling.days} working days in advance.` });
        return;
      }
    }

    if (leaveType === (policy.sickLeaveType || 'Sick Leave')) {
      const workingDaysPassed = await leaveService.calculateWorkingDays(endDate, todayStr);
      const window = policy.sickLeaveWindow.maxDaysAfterReturn;
      if (workingDaysPassed > window + 1) {
        res.status(400).json({ message: `Sick Leave must be filed within ${window} working days upon returning.` });
        return;
      }
      
      // CSC Rule: > 5 days needs medical cert
      if (workingDays > 5 && !multerReq.file) {
        res.status(400).json({ message: 'Sick Leave exceeding 5 days requires a medical certificate.' });
        return;
      }
    }

    const annualLimit = policy.annualLimits[leaveType];
    const year = new Date(startDate).getFullYear();
    if (annualLimit !== undefined) {
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

      const primaryBalance = await leaveService.getEmployeeBalance(employeeId, primaryCreditType, year);
      if (primaryBalance >= workingDays) {
        daysWithPay = workingDays;
        actualPaymentStatus = 'WITH_PAY';
      } else {
        daysWithPay = primaryBalance;
        const crossChargeType = policy.crossChargeMap[leaveType];
        if (crossChargeType) {
          const crossBalance = await leaveService.getEmployeeBalance(employeeId, crossChargeType, year);
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
      isHalfDay: !!isHalfDay,
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

      // Standardizing name for notification
      const applicant = await db.query.authentication.findFirst({
        where: eq(authentication.employeeId, employeeId),
        columns: { firstName: true, lastName: true }
      });
      const applicantName = applicant ? `${applicant.lastName}, ${applicant.firstName}` : employeeId;

      await notifyAdmins({
        senderId: employeeId,
        title: 'New Leave Request',
        message: `${applicantName} requested ${leaveType}.`,
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
      actualPaymentStatus,
      daysWithPay,
      daysWithoutPay,
      crossChargedFrom
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

    const applications = await db.select({
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

    const formattedApplications = applications.map(l => ({
        ...l,
        employeeName: formatFullName(l.lastName, l.firstName, l.middleName, l.suffix)
    }));

    res.status(200).json({
      applications: formattedApplications,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
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

    try {
      await processDeemedApprovedLeaves();
    } catch (pdError) {
      console.error('[LEAVE] Error in processDeemedApprovedLeaves:', pdError);
    }

    const conditions = [];
    if (search) {
      conditions.push(or(
        sql`${leaveApplications.leaveType} LIKE ${`%${search}%`}`,
        sql`${authentication.firstName} LIKE ${`%${search}%`}`,
        sql`${authentication.lastName} LIKE ${`%${search}%`}`
      )!);
    }

    // 100% SUCCESS: Consistent Department Filter
    if (department && department !== 'all' && department !== 'All Departments' && department !== '') {
        conditions.push(like(sql`LOWER(COALESCE(${departments.name}, 'N/A'))`, `%${department.toLowerCase()}%`));
    }

    if (typeof statusParam === 'string' && isApplicationStatus(statusParam)) {
      conditions.push(eq(leaveApplications.status, statusParam));
    }

    const startStr = normalizeToIsoDate(req.query.startDate as string) || normalizeToIsoDate(req.query.fromDate as string);
    const endStr = normalizeToIsoDate(req.query.endDate as string) || normalizeToIsoDate(req.query.toDate as string);
    const queryEmployeeId = String(req.query.employeeId || req.query.employee || '');

    // 100% SUCCESS: Date Range Normalization
    if (startStr && endStr) {
      conditions.push(and(
        lte(leaveApplications.startDate, endStr), 
        gte(leaveApplications.endDate, startStr)
      )); 
    } else if (startStr) {
        conditions.push(gte(leaveApplications.endDate, startStr));
    } else if (endStr) {
        conditions.push(lte(leaveApplications.startDate, endStr));
    }

    // 100% SUCCESS: Standardized Employee Selection
    if (queryEmployeeId && queryEmployeeId !== 'all' && queryEmployeeId !== '') {
       conditions.push(or(
         eq(leaveApplications.employeeId, queryEmployeeId),
         sql`${authentication.firstName} LIKE ${`%${queryEmployeeId}%`}`,
         sql`${authentication.lastName} LIKE ${`%${queryEmployeeId}%`}`
       )!);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const countResult = await db.select({ total: sql<number>`count(*)` })
      .from(leaveApplications)
      .leftJoin(authentication, eq(leaveApplications.employeeId, authentication.employeeId))
      .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
      .leftJoin(departments, eq(pdsHrDetails.departmentId, departments.id))
      .where(where);
    const totalItems = Number(countResult[0]?.total || 0);

    const applications = await db.select({
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
      sql`${leaveBalances.year} = YEAR(${leaveApplications.startDate})`
    ))
    .where(where)
    .orderBy(desc(leaveApplications.createdAt))
    .limit(limit)
    .offset(offset);
    const formattedApplications = applications.map(l => ({
        ...l,
        employeeName: formatFullName(l.lastName, l.firstName, l.middleName, l.suffix)
    }));

    res.status(200).json({
      applications: formattedApplications,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
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
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
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
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
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

    const validation = approveLeaveSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Validation Error', errors: validation.error.format() });
      return;
    }
    const { remarks } = validation.data;

    const application = await db.query.leaveApplications.findFirst({ where: eq(leaveApplications.id, appId) });
    if (!application) {
      res.status(404).json({ message: 'Leave application not found.' });
      return;
    }

    if (application.status === 'Approved') {
        res.status(400).json({ message: 'Application is already approved.' });
        return;
    }

    const policy = await leaveService.getLeavePolicy();
    const year = new Date(application.startDate).getFullYear();
    const isSpecialLeave = policy.specialLeavesNoDeduction.includes(application.leaveType);
    
    let finalActualPaymentStatus: PaymentStatus = application.actualPaymentStatus;
    let finalDaysWithPay = Number(application.daysWithPay);
    let finalDaysWithoutPay = Number(application.daysWithoutPay);
    const workingDays = Number(application.workingDays);

    // Re-verify balance and process deduction
    if (application.isWithPay && !isSpecialLeave) {
      const primaryCreditType = policy.leaveToCreditMap[application.leaveType];
      if (primaryCreditType) {
        const primaryBalance = await leaveService.getEmployeeBalance(application.employeeId, primaryCreditType, year);
        const deductionAmount = Math.min(workingDays, primaryBalance);
        let crossDeductionAmount = 0;

        if (deductionAmount > 0) {
          await leaveService.updateBalance(application.employeeId, primaryCreditType, -deductionAmount, 'DEDUCTION', appId, 'leave_application', remarks || `Approved ${application.leaveType}`, adminId);
        }

        const remainingNeeded = workingDays - deductionAmount;
        if (remainingNeeded > 0) {
            const crossChargeType = policy.crossChargeMap[application.leaveType];
            if (crossChargeType) {
                const crossBalance = await leaveService.getEmployeeBalance(application.employeeId, crossChargeType, year);
                crossDeductionAmount = Math.min(remainingNeeded, crossBalance);
                if (crossDeductionAmount > 0) {
                    await leaveService.updateBalance(application.employeeId, crossChargeType, -crossDeductionAmount, 'DEDUCTION', appId, 'leave_application', remarks || `Approved ${application.leaveType} (cross-charged)`, adminId);
                }
            }
        }

        finalDaysWithPay = deductionAmount + crossDeductionAmount;
        finalDaysWithoutPay = workingDays - finalDaysWithPay;
        
        if (finalDaysWithPay === workingDays) finalActualPaymentStatus = 'WITH_PAY';
        else if (finalDaysWithPay > 0) finalActualPaymentStatus = 'PARTIAL';
        else finalActualPaymentStatus = 'WITHOUT_PAY';
      }
    } else if (!application.isWithPay) {
        finalActualPaymentStatus = 'WITHOUT_PAY';
        finalDaysWithPay = 0;
        finalDaysWithoutPay = workingDays;
    } else if (isSpecialLeave) {
        finalActualPaymentStatus = 'WITH_PAY';
        finalDaysWithPay = workingDays;
        finalDaysWithoutPay = 0;
    }

    // Update application with final numbers and status
    await db.update(leaveApplications).set({ 
        status: 'Approved', 
        approvedBy: adminId, 
        approvedAt: sql`CURRENT_TIMESTAMP`, 
        updatedAt: sql`CURRENT_TIMESTAMP`,
        actualPaymentStatus: finalActualPaymentStatus,
        daysWithPay: finalDaysWithPay.toString(),
        daysWithoutPay: finalDaysWithoutPay.toString()
    }).where(eq(leaveApplications.id, appId));

    // Log to Service Record correctly
    const eventType: 'LWOP' | 'Leave' = finalActualPaymentStatus === 'WITHOUT_PAY' ? 'LWOP' : 'Leave';
    const isWithPayRecord = finalActualPaymentStatus !== 'WITHOUT_PAY';
    
    await leaveService.logToServiceRecord(
        application.employeeId, 
        eventType, 
        application.startDate, 
        application.endDate, 
        application.leaveType, 
        workingDays, 
        isWithPayRecord, 
        remarks || `Approved ${application.leaveType}`, 
        appId, 
        'leave_application', 
        adminId
    );

    if (finalDaysWithoutPay > 0) {
      await leaveService.updateLWOPSummary(application.employeeId, finalDaysWithoutPay, year);
    }

    await updateNotificationsByReference({
        type: ['leave_request', 'leave_process', 'leave_finalize'],
        referenceId: appId,
        title: 'Leave Request Approved',
        message: remarks ? `Approved: ${remarks}` : 'Your leave request has been approved.',
        newType: 'leave_approval'
    });
    res.status(200).json({ message: 'Leave approved', actualPaymentStatus: finalActualPaymentStatus });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
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
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};

export const getHolidays: AuthenticatedHandler = async (req, res) => {
  try {
    const year = parseInt(String(req.query.year || ''), 10) || getCurrentYear();
    const rows = await db.select().from(holidays).where(eq(sql`YEAR(${holidays.date})`, year));
    res.status(200).json({ holidays: rows, year });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};

export const addHoliday: AuthenticatedHandler = async (req, res) => {
  try {
    const holidaySchema = z.object({
      name: z.string().min(1, "Holiday name is required"),
      date: z.string().min(1, "Date is required"),
      type: z.enum(['Regular', 'Special Non-Working', 'Special Working'])
    });

    const validated = holidaySchema.parse(req.body);
    const { name, date, type } = validated;
    const year = new Date(date).getFullYear();

    await db.insert(holidays).values({ 
        name, 
        date, 
        type, 
        year 
    });
    
    res.status(201).json({ message: 'Holiday added' });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: 'Validation Error', errors: err.format() });
      return;
    }
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
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
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
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
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};

export const deleteEmployeeCredit: AuthenticatedHandler = async (req, res) => {
  try {
    const idParam = (req.params.id || req.params.employeeId);
    if (!idParam) {
      res.status(400).json({ message: 'Missing credit ID or Employee ID' });
      return;
    }

    const numericId = parseInt(String(idParam), 10);
    
    // If it's a numeric ID, delete by primary key
    if (!isNaN(numericId) && !String(idParam).startsWith('Emp')) {
      await db.delete(leaveBalances).where(eq(leaveBalances.id, numericId));
      res.status(200).json({ message: 'Credit deleted' });
      return;
    }

    // Otherwise, assume it's an employeeId and check for creditType/year in query
    const employeeId = String(idParam);
    const creditType = String(req.query.creditType || '');
    const year = parseInt(String(req.query.year || ''), 10) || getCurrentYear();

    if (!creditType) {
      res.status(400).json({ message: 'Missing creditType for deletion by Employee ID' });
      return;
    }

    await db.delete(leaveBalances).where(and(
      eq(leaveBalances.employeeId, employeeId),
      eq(leaveBalances.creditType, creditType),
      eq(leaveBalances.year, year)
    ));

    res.status(200).json({ message: 'Credit deleted successfully' });
  } catch (err: unknown) {
    console.error('[LEAVE] Error deleting credit:', err);
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
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
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
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
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};

export const getAllEmployeeCredits: AuthenticatedHandler = async (req, res) => {
  try {
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = parseInt(String(req.query.limit || '10'), 10) || 10;
    const search = String(req.query.search || '');
    const year = parseInt(String(req.query.year || ''), 10) || getCurrentYear();
    const offset = (page - 1) * limit;

    const policy = await leaveService.getLeavePolicy();
    const leaveToCreditMap = policy.leaveToCreditMap || {};

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
        WHERE ll.employee_id = ${leaveBalances.employeeId} 
          AND ll.credit_type = ${leaveBalances.creditType} 
          AND ll.transaction_type = 'DEDUCTION' 
          AND YEAR(ll.created_at) = ${year}
      )`,
      daysUsedWithoutPay: sql<number>`(
        SELECT COALESCE(SUM(la.days_without_pay), 0) FROM ${leaveApplications} la 
        WHERE la.employee_id = ${leaveBalances.employeeId} 
          AND (
            la.leave_type = ${leaveBalances.creditType}
            OR EXISTS (
                SELECT 1 FROM (SELECT 1) as dummy 
                WHERE ${leaveBalances.creditType} = (
                    CASE la.leave_type 
                        ${sql.raw(Object.entries(leaveToCreditMap).map(([lt, ct]) => `WHEN '${lt}' THEN '${ct}'`).join('\n                        '))}
                        ELSE la.leave_type 
                    END
                )
            )
          )
          AND la.status = 'Approved' 
          AND YEAR(la.start_date) = ${year}
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
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
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
    const currentBalance = await leaveService.getEmployeeBalance(employeeId, creditType, year);
    const result = await leaveService.updateBalance(employeeId, creditType, balance - currentBalance, 'ADJUSTMENT', undefined, 'manual', remarks || 'Admin adjustment', adminId);

    if (result.success) {
      res.status(200).json({ message: 'Credit updated', previousBalance: currentBalance, newBalance: result.newBalance });
    } else {
      res.status(500).json({ message: 'Failed to update credit' });
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
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
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};

/**
 * 100% REGISTRATION STABILITY: Initializes leave balances for a new employee.
 */
export const allocateDefaultCredits = async (employeeId: string): Promise<void> => {
  try {
    const policy = await leaveService.getLeavePolicy();
    
    if (!policy) {
        console.error('[LEAVE] Cannot allocate credits: Policy missing.');
        return;
    }

    const initialAllocations = policy.initialAllocations || {
        'Vacation Leave': 0.000,
        'Sick Leave': 0.000
    };

    for (const [creditType, amount] of Object.entries(initialAllocations)) {
        await leaveService.updateBalance(
            employeeId,
            creditType,
            Number(amount),
            'ADJUSTMENT',
            undefined,
            'manual',
            "Initial leave balance allocation during registration",
            'SYSTEM'
        );
    }
  } catch (error) {
    console.error(`[LEAVE] Failed to allocate default credits for ${employeeId}:`, error);
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
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
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
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
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
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};

export const getServiceRecord: AuthenticatedHandler = async (req, res) => {
  try {
    const employeeId = typeof req.params.employeeId === 'string' ? req.params.employeeId : '';
    if (!employeeId) {
      res.status(400).json({ message: 'Missing employee ID' });
      return;
    }
    const records = await db.select({
        ...getTableColumns(serviceRecords)
    })
    .from(serviceRecords)
    .innerJoin(authentication, eq(serviceRecords.employeeId, authentication.id))
    .where(eq(authentication.employeeId, employeeId))
    .orderBy(desc(serviceRecords.eventDate));

    const [lwopTotal] = await db.select({ totalLwopDays: sql<number>`SUM(${serviceRecords.daysCount})` })
    .from(serviceRecords)
    .innerJoin(authentication, eq(serviceRecords.employeeId, authentication.id))
    .where(and(eq(authentication.employeeId, employeeId), eq(serviceRecords.eventType, 'LWOP')));

    res.status(200).json({ records, totalLWOPDays: Number(lwopTotal?.totalLwopDays || 0) });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
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
    
    const [serviceRecordsTotal] = await db.select({ serviceRecordLwop: sql<number>`SUM(${serviceRecords.daysCount})` })
    .from(serviceRecords)
    .innerJoin(authentication, eq(serviceRecords.employeeId, authentication.id))
    .where(and(eq(authentication.employeeId, employeeId), eq(serviceRecords.eventType, 'LWOP')));

    const totalDays = Math.max(Number(lwopTotalSum?.maxCumulative || 0), Number(serviceRecordsTotal?.serviceRecordLwop || 0));
    const yearsExtension = Math.floor(totalDays / 365);
    res.status(200).json({ employeeId, totalLWOPDays: totalDays, retirementImpact: { yearsExtension, remainingDays: totalDays % 365 } });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};
