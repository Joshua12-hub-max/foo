import { db } from './db/index.js';
import { attendanceLogs, dailyTimeRecords, bioAttendanceLogs } from './db/schema.js';
import { sql, and, eq, asc } from 'drizzle-orm';
import { processDailyAttendance } from './services/attendanceProcessor.js';

async function cleanupJoshuaData() {
  const JOSHUA_ID = 'Emp-001';
  console.log(`--- CLEANING UP JOSHUA DATA (${JOSHUA_ID}) ---`);

  // 1. Purge duplicate biometric logs (keep lowest ID)
  // We identify duplicates by (employee_id, log_date, log_time, card_type)
  const [purgedBio] = await db.execute(sql`
    DELETE t1 FROM bio_attendance_logs t1
    INNER JOIN bio_attendance_logs t2 
    WHERE 
        t1.id > t2.id AND 
        t1.employee_id = t2.employee_id AND 
        t1.log_date = t2.log_date AND 
        t1.log_time = t2.log_time
  `);
  console.log(`Purged bio_attendance_logs.`);

  // 2. Purge attendance_logs (source of most duplicates)
  const [purgedAtt] = await db.execute(sql`
    DELETE t1 FROM attendance_logs t1
    INNER JOIN attendance_logs t2 
    WHERE 
        t1.id > t2.id AND 
        t1.employee_id = t2.employee_id AND 
        t1.scan_time = t2.scan_time AND 
        t1.type = t2.type
  `);
  console.log(`Purged attendance_logs.`);

  // 3. Purge daily_time_records for Emp-001 specifically to re-generate them clean
  await db.delete(dailyTimeRecords).where(eq(dailyTimeRecords.employeeId, JOSHUA_ID));
  console.log(`Deleted old DTR for ${JOSHUA_ID}.`);

  // 4. Re-process attendance for Joshua for all days found in his logs
  const dates = await db.select({ 
    date: sql<string>`DATE(${attendanceLogs.scanTime})` 
  }).from(attendanceLogs)
  .where(eq(attendanceLogs.employeeId, JOSHUA_ID))
  .groupBy(sql`DATE(${attendanceLogs.scanTime})`);

  console.log(`Re-processing ${dates.length} days for Joshua...`);
  for (const row of dates) {
    if (row.date) {
        console.log(`Processing Joshua on ${row.date}`);
        await processDailyAttendance(JOSHUA_ID, row.date);
    }
  }

  console.log('--- JOSHUA DATA CLEANUP COMPLETE 100% ---');
  process.exit(0);
}

cleanupJoshuaData().catch(err => {
  console.error(err);
  process.exit(1);
});
