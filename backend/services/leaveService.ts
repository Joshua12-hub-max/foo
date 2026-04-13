import { db } from '../db/index.js';
import { 
  holidays, 
  leaveBalances, 
  leaveLedger, 
  lwopSummary, 
  serviceRecords, 
  internalPolicies,
  authentication,
  shiftTemplates
} from '../db/schema.js';
import { eq, and, between, ne, sql, lt, desc } from 'drizzle-orm';
import { leavePolicySchema, type LeavePolicyContentStrict } from '../schemas/leaveSchema.js';
import { type TransactionType } from '../types/leave.types.js';

/**
 * Shared Leave Service to centralize business logic and prevent circular dependencies.
 */

const getNumericId = async (empId: string): Promise<number | null> => {
    const res = await db.select({ id: authentication.id })
        .from(authentication)
        .where(eq(authentication.employeeId, empId))
        .limit(1);
    return res[0]?.id || null;
};

export const getLeavePolicy = async (): Promise<LeavePolicyContentStrict> => {
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
        console.error('[LEAVE SERVICE] getLeavePolicy error:', error);
        throw error;
    }
};

export const getHolidaysInRange = async (startDate: string, endDate: string): Promise<string[]> => {
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
    console.error('[LEAVE SERVICE] getHolidaysInRange error:', error);
    return [];
  }
};

export const calculateWorkingDays = async (startDate: string, endDate: string): Promise<number> => {
  if (!startDate || !endDate) return 0;
  
  const holidaysList = await getHolidaysInRange(startDate, endDate);
  const holidaySet = new Set(holidaysList);

  let count = 0;
  const curDate = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(curDate.getTime()) || isNaN(end.getTime())) return 0;

  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    const dateStr = curDate.toISOString().split('T')[0];

    // Exclude weekends (0=Sunday, 6=Saturday) and holidays
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateStr)) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }

  return count;
};

export const getEmployeeBalance = async (
  employeeId: string,
  creditType: string,
  year?: number
): Promise<number> => {
  try {
    const targetYear = year || new Date().getFullYear();
    const row = await db.query.leaveBalances.findFirst({
      where: and(
        eq(leaveBalances.employeeId, employeeId),
        eq(leaveBalances.creditType, creditType),
        eq(leaveBalances.year, targetYear)
      )
    });
    return row ? Number(row.balance) : 0;
  } catch (error) {
    console.error('[LEAVE SERVICE] getEmployeeBalance error:', error);
    return 0;
  }
};

export const updateBalance = async (
  employeeId: string,
  creditType: string,
  amount: number,
  transactionType: TransactionType,
  referenceId?: number,
  referenceType?: 'leave_application' | 'monetization' | 'dtr' | 'manual',
  remarks?: string,
  createdBy?: string
): Promise<{ success: boolean; newBalance: number }> => {
  const year = new Date().getFullYear();

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
      referenceId: referenceId || null,
      referenceType: referenceType || null,
      remarks: remarks || null,
      createdBy: createdBy || 'System'
    });

    return { success: true, newBalance: newBalanceValue };
  } catch (error) {
    console.error('[LEAVE SERVICE] updateBalance error:', error);
    return { success: false, newBalance: 0 };
  }
};

export const updateLWOPSummary = async (employeeId: string, lwopDays: number, yearOverride?: number): Promise<void> => {
  const year = yearOverride || new Date().getFullYear();

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
    
    // Note: This logic for cumulative is slightly simplistic if records are updated out of order,
    // but works for standard sequential updates.
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
  } catch (error) {
    console.error('[LEAVE SERVICE] updateLWOPSummary error:', error);
  }
};

export const logToServiceRecord = async (
  empId: string,
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
    const numericId = await getNumericId(empId);
    if (!numericId) {
        console.error(`[LEAVE SERVICE] Cannot log to service record: numeric ID not found for ${empId}`);
        return;
    }

    await db.insert(serviceRecords).values({
      employeeId: numericId,
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
  } catch (error) {
  console.error('[LEAVE SERVICE] logToServiceRecord error:', error);
  }
  };

  export const getTardinessPolicy = async (): Promise<Record<string, unknown> | null> => {
  try {
      const results = await db.select()
      .from(internalPolicies)
      .where(eq(internalPolicies.category, 'tardiness'))
      .limit(1);

      if (!results[0]) return null;
      return typeof results[0].content === 'string' ? JSON.parse(results[0].content) : results[0].content;
  } catch (error) {
      console.error('[LEAVE SERVICE] getTardinessPolicy error:', error);
      return null;
  }
  };

  export const getPenaltyPolicy = async (): Promise<Record<string, unknown> | null> => {
  try {
      const results = await db.select()
      .from(internalPolicies)
      .where(eq(internalPolicies.category, 'penalties'))
      .limit(1);

      if (!results[0]) return null;
      return typeof results[0].content === 'string' ? JSON.parse(results[0].content) : results[0].content;
  } catch (error) {
      console.error('[LEAVE SERVICE] getPenaltyPolicy error:', error);
      return null;
  }
  };

  export const getDefaultShift = async () => {
    try {
        const [shift] = await db.select({
            name: shiftTemplates.name,
            startTime: shiftTemplates.startTime,
            endTime: shiftTemplates.endTime
        })
        .from(shiftTemplates)
        .where(eq(shiftTemplates.isDefault, true))
        .limit(1);
        
        return shift || { name: 'Standard Shift', startTime: '08:00:00', endTime: '17:00:00' };
    } catch (error) {
        console.error('[LEAVE SERVICE] getDefaultShift error:', error);
        return { name: 'Standard Shift', startTime: '08:00:00', endTime: '17:00:00' };
    }
  };
