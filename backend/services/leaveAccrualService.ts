import { db } from '../db/index.js';
import { 
  authentication, 
  leaveApplications, 
  tardinessSummary, 
  accrualRules,
  pdsHrDetails
} from '../db/schema.js';
import { eq, and, ne, sql, inArray, desc } from 'drizzle-orm';
import { 
  type CreditType,
} from '../types/leave.types.js';
import * as leaveService from './leaveService.js';

/**
 * Calculate earned credits based on Days Present (CSC Rule XVI)
 * Formula: Days Present = 30 - Days Absent/LWOP
 */
export const calculateEarnedCreditsFromRules = (
  daysPresent: number, 
  rules: { daysPresent: string | number; earnedCredits: string | number }[]
): number => {
  // rules is expected to be sorted descending by daysPresent
  const match = rules.find(row => Number(row.daysPresent) <= daysPresent);
  return match ? Number(match.earnedCredits) : 0.000;
};

/**
 * Get total LWOP days for an employee for a specific month/year
 * with 100% precision by checking individual days intersection.
 */
export const getLWOPDays = async (employeeId: string, month: number, year: number): Promise<number> => {
  // 1. Get all Approved leave applications that overlap with the target month
  const firstDayOfMonth = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(year, month, 0).toISOString().split('T')[0];

  const overlappingLeaves = await db.select({
    startDate: leaveApplications.startDate,
    endDate: leaveApplications.endDate,
    isWithPay: leaveApplications.isWithPay,
    daysWithoutPay: leaveApplications.daysWithoutPay,
    workingDays: leaveApplications.workingDays
  })
  .from(leaveApplications)
  .where(and(
    eq(leaveApplications.employeeId, employeeId),
    eq(leaveApplications.status, 'Approved'),
    sql`${leaveApplications.startDate} <= ${lastDayOfMonth}`,
    sql`${leaveApplications.endDate} >= ${firstDayOfMonth}`
  ));

  let totalLWOP = 0;

  for (const leave of overlappingLeaves) {
      // Calculate intersection: max(leaveStart, monthStart) to min(leaveEnd, monthEnd)
      const start = leave.startDate > firstDayOfMonth ? leave.startDate : firstDayOfMonth;
      const end = leave.endDate < lastDayOfMonth ? leave.endDate : lastDayOfMonth;

      const workingDaysInMonth = await leaveService.calculateWorkingDays(start, end);

      if (leave.isWithPay === false) {
          // Fully without pay
          totalLWOP += workingDaysInMonth;
      } else if (Number(leave.daysWithoutPay) > 0) {
          // Partial pay: This is tricky. If 2/5 days are without pay, 
          // we should ideally know WHICH days. 
          // Assumption: LWOP portion is distributed evenly if not specified.
          const ratio = Number(leave.daysWithoutPay) / Number(leave.workingDays);
          totalLWOP += workingDaysInMonth * ratio;
      }
  }

  // 2. Add Tardiness/Undertime equivalent days
  const tardinessRecord = await db.query.tardinessSummary.findFirst({
      where: and(
          eq(tardinessSummary.employeeId, employeeId),
          eq(tardinessSummary.month, month),
          eq(tardinessSummary.year, year)
      )
  });

  if (tardinessRecord && tardinessRecord.daysEquivalent) {
      totalLWOP += Number(tardinessRecord.daysEquivalent);
  }

  return Number(totalLWOP.toFixed(3));
};

/**
 * Accrue credits for all regular employees for a specific month
 */
export const accrueCreditsForMonth = async (month: number, year: number, specificEmployeeIds: string[] = []) => {
  try {
    const policy = await leaveService.getLeavePolicy();
    const accruingTypes = policy.monthlyAccrual.accruingTypes;
    const accrualRuleType = policy.monthlyAccrual.accrualRuleType;

    if (accruingTypes.length === 0) {
        return { success: false, message: 'No eligible employment types defined.' };
    }

    const rules = await db.select()
        .from(accrualRules)
        .where(eq(accrualRules.ruleType, accrualRuleType))
        .orderBy(desc(accrualRules.daysPresent));

    const conditions = [
      ne(authentication.role, 'Administrator'),
      inArray(pdsHrDetails.appointmentType, accruingTypes as any)
    ];
    
    if (specificEmployeeIds.length > 0) {
      conditions.push(inArray(authentication.employeeId, specificEmployeeIds));
    }

    const employees = await db.select({
      employeeId: authentication.employeeId,
    })
    .from(authentication)
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .where(and(...conditions));

    let processedCount = 0;
    const remarks = `Monthly accrual for ${month}/${year}`;

    for (const employee of employees) {
      const { employeeId } = employee;
      if (!employeeId) continue;

      const lwopDays = await getLWOPDays(employeeId, month, year);
      const daysPresent = Math.max(0, 30 - lwopDays);
      const earnedCredits = calculateEarnedCreditsFromRules(daysPresent, rules);

      if (earnedCredits > 0) {
        for (const creditType of policy.monthlyAccrual.accrualCreditTypes) {
          await leaveService.updateBalance(
            employeeId,
            creditType as CreditType,
            earnedCredits,
            'ACCRUAL',
            undefined,
            'manual',
            remarks,
            'SYSTEM'
          );
        }
      }
      processedCount++;
    }

    return {
        success: true,
        processedCount,
        month,
        year
    };

  } catch (error) {
    console.error('[ACCRUAL SERVICE] Error:', error);
    throw error;
  }
};
