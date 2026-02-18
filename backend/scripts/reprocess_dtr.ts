import { db } from '../db/index.js';

import { sql } from 'drizzle-orm';
import { processDailyAttendance } from '../services/attendanceProcessor.js';

async function reprocessAllDTR() {
  console.log('=== REPROCESSING ALL DTR RECORDS ===');
  console.log('This will recalculate late/undertime/status for every employee+date combo.');

  try {
    // 1. Get all unique employee+date combos from attendance_logs
    const combos: any[] = await db.execute(
      sql`SELECT DISTINCT employee_id, DATE(scan_time) as log_date FROM attendance_logs ORDER BY log_date ASC`
    );

    // The result from execute is [rows, fields]
    const rows = Array.isArray(combos[0]) ? combos[0] : combos;

    console.log(`Found ${rows.length} unique employee+date combinations to process.`);

    let processed = 0;
    let errors = 0;

    for (const row of rows) {
      const employeeId = row.employee_id;
      const dateStr = typeof row.log_date === 'string' 
        ? row.log_date 
        : new Date(row.log_date).toISOString().split('T')[0];

      try {
        await processDailyAttendance(employeeId, dateStr);
        processed++;

        // Progress indicator every 50 records
        if (processed % 50 === 0) {
          console.log(`  Processed ${processed}/${rows.length}...`);
        }
      } catch (err: any) {
        errors++;
        console.error(`  ❌ Error processing ${employeeId} on ${dateStr}: ${err.message}`);
      }
    }

    console.log(`\n✅ REPROCESSING COMPLETE`);
    console.log(`  Total: ${rows.length}`);
    console.log(`  Processed: ${processed}`);
    console.log(`  Errors: ${errors}`);

    // 2. Quick verification
    const [dtrCount]: any = await db.execute(sql`SELECT COUNT(*) as count FROM daily_time_records`);
    const [lateCount]: any = await db.execute(sql`SELECT COUNT(*) as count FROM daily_time_records WHERE late_minutes > 0`);
    const [tardinessCount]: any = await db.execute(sql`SELECT COUNT(*) as count FROM tardiness_summary`);

    console.log(`\n=== VERIFICATION ===`);
    console.log(`  DTR Records: ${dtrCount[0].count}`);
    console.log(`  With Late Minutes: ${lateCount[0].count}`);
    console.log(`  Tardiness Summaries: ${tardinessCount[0].count}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

reprocessAllDTR();
