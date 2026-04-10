import { db } from './db/index.js';
import { authentication, attendanceLogs, bioAttendanceLogs, dailyTimeRecords } from './db/schema.js';
import { sql } from 'drizzle-orm';

async function debug() {
  console.log('--- DATABASE ID AUDIT ---');

  const users = await db.select({ id: authentication.id, employeeId: authentication.employeeId }).from(authentication).limit(10);
  console.log('\n[Authentication] Sample IDs:', users);

  const logs = await db.select({ id: attendanceLogs.id, employeeId: attendanceLogs.employeeId, scanTime: attendanceLogs.scanTime, type: attendanceLogs.type }).from(attendanceLogs).limit(10);
  console.log('\n[Attendance Logs] Sample IDs:', logs);

  const bioLogs = await db.select({ id: bioAttendanceLogs.id, employeeId: bioAttendanceLogs.employeeId, logDate: bioAttendanceLogs.logDate, logTime: bioAttendanceLogs.logTime }).from(bioAttendanceLogs).limit(10);
  console.log('\n[Biometric Raw Logs] Sample IDs:', bioLogs);

  const dtrs = await db.select({ id: dailyTimeRecords.id, employeeId: dailyTimeRecords.employeeId, date: dailyTimeRecords.date, timeIn: dailyTimeRecords.timeIn, timeOut: dailyTimeRecords.timeOut }).from(dailyTimeRecords).limit(10);
  console.log('\n[Daily Time Records] Sample IDs:', dtrs);

  process.exit(0);
}

debug().catch(err => {
  console.error(err);
  process.exit(1);
});
