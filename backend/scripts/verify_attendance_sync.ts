import { db } from '../db/index.js';
import { dailyTimeRecords, tardinessSummary } from '../db/schema.js';
import { sql } from 'drizzle-orm';

async function verify() {
  try {
    console.log('--- FINAL ATTENDANCE VERIFICATION ---');

    // 1. Status Distribution
    const statusCounts = await db.execute(sql.raw(`
        SELECT status, COUNT(*) as count 
        FROM daily_time_records 
        GROUP BY status
    `)) as any;
    console.log('Status Distribution:', statusCounts[0]);

    // 2. Legacy ID Check (Should be 0)
    const legacyIds = await db.execute(sql.raw(`
        SELECT count(*) as count FROM daily_time_records WHERE LENGTH(employee_id) > 7
    `)) as any;
    console.log('Legacy IDs in DTR:', legacyIds[0][0].count);

    // 3. Absent with Logs Check (Should be 0)
    const absentWithLogs = await db.execute(sql.raw(`
        SELECT count(*) as count
        FROM daily_time_records dtr
        WHERE dtr.status = 'Absent'
        AND EXISTS (
            SELECT 1 FROM attendance_logs logs 
            WHERE logs.employee_id = dtr.employee_id 
            AND DATE(logs.scan_time) = dtr.date
        )
    `)) as any;
    console.log('Absent records that have logs (Anomalies):', absentWithLogs[0][0].count);

    // 4. Tardiness Summary Check
    const summaryCount = await db.execute(sql.raw(`
        SELECT count(*) as count FROM tardiness_summary
    `)) as any;
    console.log('Tardiness Summary Records:', summaryCount[0][0].count);

    console.log('--- VERIFICATION COMPLETE ---');
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
}

verify();
