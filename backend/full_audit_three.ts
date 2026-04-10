import { db } from './db/index.js';
import { bioAttendanceLogs, attendanceLogs, dailyTimeRecords } from './db/schema.js';
import { inArray, asc } from 'drizzle-orm';

async function fullAudit() {
  const ids = ['Emp-001', 'Emp-002', 'Emp-003'];
  console.log('--- STARTING FULL-SCALED AUDIT (EMP-001, EMP-002, EMP-003) ---');

  const bio = await db.select().from(bioAttendanceLogs).where(inArray(bioAttendanceLogs.employeeId, ids)).orderBy(asc(bioAttendanceLogs.employeeId), asc(bioAttendanceLogs.id));
  console.log('\n[BIO_ATTENDANCE_LOGS] Raw Rows:');
  console.table(bio.map(b => ({ id: b.id, emp: b.employeeId, date: b.logDate, time: b.logTime, type: b.cardType })));

  const att = await db.select().from(attendanceLogs).where(inArray(attendanceLogs.employeeId, ids)).orderBy(asc(attendanceLogs.employeeId), asc(attendanceLogs.id));
  console.log('\n[ATTENDANCE_LOGS] Raw Rows:');
  console.table(att.map(a => ({ id: a.id, emp: a.employeeId, scan: a.scanTime, type: a.type })));

  const dtr = await db.select().from(dailyTimeRecords).where(inArray(dailyTimeRecords.employeeId, ids)).orderBy(asc(dailyTimeRecords.employeeId), asc(dailyTimeRecords.date));
  console.log('\n[DAILY_TIME_RECORDS] Raw Rows:');
  console.table(dtr.map(d => ({ id: d.id, emp: d.employeeId, date: d.date, in: d.timeIn, out: d.timeOut, status: d.status })));

  process.exit(0);
}

fullAudit().catch(err => {
    console.error(err);
    process.exit(1);
});
