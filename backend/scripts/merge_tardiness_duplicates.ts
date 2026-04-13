import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function mergeTardiness() {
  console.log('--- MERGING TARDINESS SUMMARY DUPLICATES ---');

  // Identify duplicates by normalized ID, year, and month
  const queryFind = sql.raw(`
    SELECT 
      CONCAT('Emp-', LPAD(REGEXP_REPLACE(employee_id, '[^0-9]', ''), 3, '0')) as normalized_id,
      year, 
      month
    FROM tardiness_summary
    GROUP BY normalized_id, year, month
    HAVING COUNT(*) > 1
  `);

  try {
    const [duplicates] = await db.execute(queryFind) as any[];
    console.log(`Found ${duplicates.length} duplicate group(s).`);

    for (const dup of duplicates) {
      console.log(`Merging ${dup.normalized_id} for ${dup.year}-${dup.month}...`);
      
      // Get all records in this group
      const queryGet = sql.raw(`
        SELECT * FROM tardiness_summary 
        WHERE CONCAT('Emp-', LPAD(REGEXP_REPLACE(employee_id, '[^0-9]', ''), 3, '0')) = '${dup.normalized_id}'
        AND year = ${dup.year}
        AND month = ${dup.month}
      `);
      
      const [records] = await db.execute(queryGet) as any[];
      
      if (records.length <= 1) continue;

      // Calculate sums
      const totals = {
        totalLateMinutes: 0,
        totalUndertimeMinutes: 0,
        totalLateCount: 0,
        totalUndertimeCount: 0,
        totalAbsenceCount: 0,
        daysEquivalent: 0,
        deductedFromVl: 0,
        chargedAsLwop: 0
      };

      records.forEach((r: any) => {
        totals.totalLateMinutes += (r.total_late_minutes || 0);
        totals.totalUndertimeMinutes += (r.total_undertime_minutes || 0);
        totals.totalLateCount += (r.total_late_count || 0);
        totals.totalUndertimeCount += (r.total_undertime_count || 0);
        totals.totalAbsenceCount += (r.total_absence_count || 0);
        totals.daysEquivalent += parseFloat(r.days_equivalent || '0');
        totals.deductedFromVl += parseFloat(r.deducted_from_vl || '0');
        totals.chargedAsLwop += parseFloat(r.charged_as_lwop || '0');
      });

      // Delete the rest FIRST to avoid unique constraint violation on the primary record
      const otherIds = records.slice(1).map((r: any) => r.id);
      const deleteQuery = sql.raw(`DELETE FROM tardiness_summary WHERE id IN (${otherIds.join(',')})`);
      await db.execute(deleteQuery);

      // Update the FIRST record with the totals and normalized ID
      const firstId = records[0].id;
      const updateQuery = sql.raw(`
        UPDATE tardiness_summary 
        SET 
          employee_id = '${dup.normalized_id}',
          total_late_minutes = ${totals.totalLateMinutes},
          total_undertime_minutes = ${totals.totalUndertimeMinutes},
          total_late_count = ${totals.totalLateCount},
          total_undertime_count = ${totals.totalUndertimeCount},
          total_absence_count = ${totals.totalAbsenceCount},
          days_equivalent = ${totals.daysEquivalent.toFixed(3)},
          deducted_from_vl = ${totals.deductedFromVl.toFixed(3)},
          charged_as_lwop = ${totals.chargedAsLwop.toFixed(3)}
        WHERE id = ${firstId}
      `);
      
      await db.execute(updateQuery);
      
      console.log(`Successfully merged ${dup.normalized_id}.`);
    }
  } catch (error: any) {
    console.error('Error during merge:', error.message);
  }

  process.exit(0);
}

mergeTardiness();
