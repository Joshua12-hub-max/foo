import { db } from '../db/index.js';
import { dailyTimeRecords, tardinessSummary } from '../db/schema.js';
import { eq, and, sql, between } from 'drizzle-orm';

/**
 * Aggregates daily DTR data for an employee into a monthly summary.
 * This is used for tardiness deductions and policy violation tracking.
 */
export const updateMonthlyTardinessSummary = async (
  employeeId: string,
  year: number,
  month: number
): Promise<void> => {
  try {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    // 1. Fetch all DTRs for the month
    const dtrs = await db.select({
      lateMinutes: dailyTimeRecords.lateMinutes,
      undertimeMinutes: dailyTimeRecords.undertimeMinutes,
      status: dailyTimeRecords.status
    })
    .from(dailyTimeRecords)
    .where(and(
      eq(dailyTimeRecords.employeeId, employeeId),
      between(dailyTimeRecords.date, startDate, endDate)
    ));

    // 2. Aggregate counts and totals
    let totalLateMinutes = 0;
    let totalUndertimeMinutes = 0;
    let lateCount = 0;
    let undertimeCount = 0;
    let absenceCount = 0;

    dtrs.forEach(dtr => {
      // L2 FIX: Include 'No Logs' to match tardinessUtils.ts (was only 'Absent')
      if (dtr.status === 'Absent' || dtr.status === 'No Logs') {
        absenceCount++;
      }
      if (dtr.lateMinutes && dtr.lateMinutes > 0) {
        totalLateMinutes += dtr.lateMinutes;
        lateCount++;
      }
      if (dtr.undertimeMinutes && dtr.undertimeMinutes > 0) {
        totalUndertimeMinutes += dtr.undertimeMinutes;
        undertimeCount++;
      }
    });

    // 3. Upsert into tardiness_summary
    await db.insert(tardinessSummary).values({
      employeeId,
      year,
      month,
      totalLateMinutes,
      totalUndertimeMinutes,
      totalLateCount: lateCount,
      totalUndertimeCount: undertimeCount,
      totalAbsenceCount: absenceCount,
      processedBy: 'SYSTEM'
    }).onDuplicateKeyUpdate({
      set: {
        totalLateMinutes,
        totalUndertimeMinutes,
        totalLateCount: lateCount,
        totalUndertimeCount: undertimeCount,
        totalAbsenceCount: absenceCount,
        updatedAt: sql`CURRENT_TIMESTAMP`
      }
    });

    console.warn(`Updated Monthly Summary for ${employeeId} (${month}/${year}): Lates=${lateCount}, Minutes=${totalLateMinutes}`);
  } catch (error) {
    console.error('Error updating monthly tardiness summary:', error);
    throw error;
  }
};
