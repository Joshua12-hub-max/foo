import { db } from './db/index.js';
import { bioAttendanceLogs, attendanceLogs, dailyTimeRecords } from './db/schema.js';
import { eq, sql, and } from 'drizzle-orm';

async function joshuaAudit() {
  const JOSHUA_ID = 'Emp-001';
  console.log('--- JOSHUA (PALERO) TRIPLE TABLE AUDIT ---');

  const bio = await db.select().from(bioAttendanceLogs).where(eq(bioAttendanceLogs.employeeId, JOSHUA_ID));
  console.log('\n[BIO_ATTENDANCE_LOGS]:', bio.length, 'records');
  bio.forEach(b => console.log(`ID: ${b.id} | Date: ${b.logDate} | Time: ${b.logTime} | Type: ${b.cardType}`));

  const att = await db.select().from(attendanceLogs).where(eq(attendanceLogs.employeeId, JOSHUA_ID));
  console.log('\n[ATTENDANCE_LOGS]:', att.length, 'records');
  att.forEach(a => console.log(`ID: ${a.id} | Time: ${a.scanTime} | Type: ${a.type}`));

  const dtr = await db.select().from(dailyTimeRecords).where(eq(dailyTimeRecords.employeeId, JOSHUA_ID));
  console.log('\n[DAILY_TIME_RECORDS]:', dtr.length, 'records');
  dtr.forEach(d => console.log(`ID: ${d.id} | Date: ${d.date} | In: ${d.timeIn} | Out: ${d.timeOut} | Status: ${d.status}`));

  process.exit(0);
}

joshuaAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
