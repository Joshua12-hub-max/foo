import { db } from './db/index.js';
import { attendanceLogs, dailyTimeRecords } from './db/schema.js';
import { sql, and, eq, asc } from 'drizzle-orm';
import { processDailyAttendance } from './services/attendanceProcessor.js';

async function finalClean() {
  console.log('--- FINAL DATA HYGIENE & VALIDATION ---');

  // 1. Remove duplicate logs that might have been created during the mismatch period
  // We keep the one with the lowest ID for each unique (employee, scanTime, type)
  await db.execute(sql`
    DELETE t1 FROM attendance_logs t1
    INNER JOIN attendance_logs t2 
    WHERE 
        t1.id > t2.id AND 
        t1.employee_id = t2.employee_id AND 
        t1.scan_time = t2.scan_time AND 
        t1.type = t2.type
  `);
  console.log('Duplicate logs purged.');

  // 2. Clear out DTRs and re-generate them from clean logs to be 100% sure
  await db.execute(sql`DELETE FROM daily_time_records`);
  console.log('DTR table cleared for fresh re-generation.');

  // 3. Re-process everything
  const uniqueCombos = await db.select({ 
    employeeId: attendanceLogs.employeeId, 
    date: sql<string>`DATE(${attendanceLogs.scanTime})` 
  }).from(attendanceLogs).groupBy(attendanceLogs.employeeId, sql`DATE(${attendanceLogs.scanTime})`);

  for (const combo of uniqueCombos) {
    if (combo.employeeId && combo.date) {
      console.log(`Final Processing: ${combo.employeeId} on ${combo.date}`);
      await processDailyAttendance(combo.employeeId, combo.date);
    }
  }

  // 4. Final Verification
  const finalDtrs = await db.select().from(dailyTimeRecords);
  console.log('\n--- FINAL DTR VERIFICATION ---');
  finalDtrs.forEach(d => {
    console.log(`ID: ${d.employeeId} | Date: ${d.date} | In: ${d.timeIn} | Out: ${d.timeOut} | Status: ${d.status}`);
  });

  process.exit(0);
}

finalClean().catch(err => {
    console.error(err);
    process.exit(1);
});
