import { db } from './db/index.js';
import { bioAttendanceLogs, attendanceLogs, dailyTimeRecords } from './db/schema.js';
import { inArray, sql } from 'drizzle-orm';
import { processDailyAttendance } from './services/attendanceProcessor.js';

async function globalRefresh() {
  const ids = ['Emp-001', 'Emp-002', 'Emp-003'];
  console.log('--- GLOBAL SYSTEM REFRESH (EMP-001, EMP-002, EMP-003) ---');

  // 1. Final Purge (Triple-Checked)
  // attendance_logs
  await db.execute(sql`
    DELETE t1 FROM attendance_logs t1
    INNER JOIN attendance_logs t2 
    WHERE 
        t1.id > t2.id AND 
        t1.employee_id = t2.employee_id AND 
        t1.scan_time = t2.scan_time AND 
        t1.type = t2.type
  `);
  
  // bio_attendance_logs
  await db.execute(sql`
    DELETE t1 FROM bio_attendance_logs t1
    INNER JOIN bio_attendance_logs t2 
    WHERE 
        t1.id > t2.id AND 
        t1.employee_id = t2.employee_id AND 
        t1.log_date = t2.log_date AND 
        t1.log_time = t2.log_time
  `);

  console.log('Duplicates purged from logs.');

  // 2. Wipe DTR for these 3 employees only
  await db.delete(dailyTimeRecords).where(inArray(dailyTimeRecords.employeeId, ids));
  console.log('DTR table wiped for the 3 target employees.');

  // 3. Re-process all days for these 3 employees
  const uniqueDates = await db.select({ 
    emp: attendanceLogs.employeeId, 
    date: sql<string>`DATE(${attendanceLogs.scanTime})` 
  }).from(attendanceLogs)
  .where(inArray(attendanceLogs.employeeId, ids))
  .groupBy(attendanceLogs.employeeId, sql`DATE(${attendanceLogs.scanTime})`);

  console.log(`Re-processing ${uniqueDates.length} employee-days...`);
  for (const row of uniqueDates) {
    if (row.emp && row.date) {
        console.log(`Refreshing: ${row.emp} on ${row.date}`);
        await processDailyAttendance(row.emp, row.date);
    }
  }

  // 4. Verification
  const final = await db.select().from(dailyTimeRecords).where(inArray(dailyTimeRecords.employeeId, ids));
  console.log('\n--- FINAL VERIFICATION (STATUS SHOULD BE PRESENT/PENDING) ---');
  console.table(final.map(f => ({ 
      emp: f.employeeId, 
      date: f.date, 
      in: f.timeIn, 
      out: f.timeOut, 
      status: f.status,
      ut: f.undertimeMinutes
  })));

  process.exit(0);
}

globalRefresh().catch(err => {
    console.error(err);
    process.exit(1);
});
