import { db } from '../db/index.js';
import { tardinessSummary, dailyTimeRecords, authentication } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { currentManilaDateTime } from './dateUtils.js';

export const updateTardinessSummary = async (
  employeeId: string,
  dateStr: string
): Promise<void> => {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // 1. Fetch Employee's dailyTargetHours
    const employeeRows = await db.select({ dailyTargetHours: authentication.dailyTargetHours })
      .from(authentication)
      .where(eq(authentication.employeeId, employeeId))
      .limit(1);
    const dailyTargetHours = Number(employeeRows[0]?.dailyTargetHours) || 8;

    // 2. Calculate totals for the month
    const result = await db.select({
      totalLateMinutes: sql<number>`SUM(${dailyTimeRecords.lateMinutes})`,
      totalUndertimeMinutes: sql<number>`SUM(${dailyTimeRecords.undertimeMinutes})`,
      totalLateCount: sql<number>`COUNT(CASE WHEN ${dailyTimeRecords.lateMinutes} > 0 THEN 1 END)`,
      totalUndertimeCount: sql<number>`COUNT(CASE WHEN ${dailyTimeRecords.undertimeMinutes} > 0 THEN 1 END)`,
      totalAbsenceCount: sql<number>`COUNT(CASE WHEN ${dailyTimeRecords.status} = 'Absent' THEN 1 END)`
    })
    .from(dailyTimeRecords)
    .where(and(
      eq(dailyTimeRecords.employeeId, employeeId),
      sql`YEAR(${dailyTimeRecords.date}) = ${year}`,
      sql`MONTH(${dailyTimeRecords.date}) = ${month}`
    ));

    const stats = result[0];
    const totalLateMinutes = Number(stats.totalLateMinutes) || 0;
    const totalUndertimeMinutes = Number(stats.totalUndertimeMinutes) || 0;
    
    // 3. Compute Days Equivalent
    const totalMinutes = totalLateMinutes + totalUndertimeMinutes;
    const daysEquivalent = (totalMinutes / (dailyTargetHours * 60)).toFixed(3);

    // 4. Upsert into tardiness_summary
    await db.insert(tardinessSummary).values({
      employeeId,
      year,
      month,
      totalLateMinutes: totalLateMinutes,
      totalUndertimeMinutes: totalUndertimeMinutes,
      totalLateCount: Number(stats.totalLateCount) || 0,
      totalUndertimeCount: Number(stats.totalUndertimeCount) || 0,
      totalAbsenceCount: Number(stats.totalAbsenceCount) || 0,
      daysEquivalent: daysEquivalent,
      processedAt: currentManilaDateTime()
    }).onDuplicateKeyUpdate({
      set: {
        totalLateMinutes: stats.totalLateMinutes || 0,
        totalUndertimeMinutes: stats.totalUndertimeMinutes || 0,
        totalLateCount: stats.totalLateCount || 0,
        totalUndertimeCount: stats.totalUndertimeCount || 0,
        totalAbsenceCount: stats.totalAbsenceCount || 0,
        daysEquivalent: daysEquivalent,
        processedAt: currentManilaDateTime()
      }
    });

    // console.log(`[TARDINESS] Updated summary for ${employeeId} ${month}/${year}. TargetHours=${dailyTargetHours}, DaysEq=${daysEquivalent}`);
  } catch (error) {
    console.error('[TARDINESS] Error updating summary:', error);
  }
};
