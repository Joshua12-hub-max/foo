import { db } from '../db/index.js';
import { tardinessSummary, dailyTimeRecords } from '../db/schema.js';
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

    // const employeeRows = await db.select({ dailyTargetHours: authentication.dailyTargetHours })
    //   .from(authentication)
    //   .where(eq(authentication.employeeId, employeeId))
    //   .limit(1);
    // const dailyTargetHours = Number(employeeRows[0]?.dailyTargetHours) || 8;

    // 2. Calculate totals for the month in memory to avoid Drizzle raw-query bugs
    const records = await db.select().from(dailyTimeRecords).where(
      and(
        eq(dailyTimeRecords.employeeId, employeeId),
        sql`YEAR(${dailyTimeRecords.date}) = ${year}`,
        sql`MONTH(${dailyTimeRecords.date}) = ${month}`
      )
    );

    let totalLateMinutes = 0;
    let totalUndertimeMinutes = 0;
    let totalLateCount = 0;
    let totalUndertimeCount = 0;
    let totalAbsenceCount = 0;

    for (const r of records) {
      if (r.lateMinutes && r.lateMinutes > 0) {
        totalLateMinutes += r.lateMinutes;
        totalLateCount++;
      }
      if (r.undertimeMinutes && r.undertimeMinutes > 0) {
        totalUndertimeMinutes += r.undertimeMinutes;
        totalUndertimeCount++;
      }
      if (r.status === 'Absent' || r.status === 'No Logs') {
        totalAbsenceCount++;
      }
    }
    
    // 3. Compute Days Equivalent
    // const totalMinutes = totalLateMinutes + totalUndertimeMinutes;
    // const daysEquivalent = (totalMinutes / (dailyTargetHours * 60)).toFixed(3);

    // 4. Upsert into tardiness_summary
    await db.insert(tardinessSummary).values({
      employeeId,
      year,
      month,
      totalLateMinutes: totalLateMinutes,
      totalUndertimeMinutes: totalUndertimeMinutes,
      totalLateCount: totalLateCount,
      totalUndertimeCount: totalUndertimeCount,
      totalAbsenceCount: totalAbsenceCount,
      // daysEquivalent is generated, do not insert
      processedAt: currentManilaDateTime()
    }).onDuplicateKeyUpdate({
      set: {
        totalLateMinutes: totalLateMinutes,
        totalUndertimeMinutes: totalUndertimeMinutes,
        totalLateCount: totalLateCount,
        totalUndertimeCount: totalUndertimeCount,
        totalAbsenceCount: totalAbsenceCount,
        // daysEquivalent is generated, do not update
        processedAt: currentManilaDateTime()
      }
    });

    // console.log(`[TARDINESS] Updated summary for ${employeeId} ${month}/${year}. TargetHours=${dailyTargetHours}, DaysEq=${daysEquivalent}`);
  } catch (error) {
    console.error('[TARDINESS] Error updating summary:', error);
  }
};
