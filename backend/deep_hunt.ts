import { db } from './db/index.js';
import { bioAttendanceLogs, attendanceLogs, dailyTimeRecords, authentication } from './db/schema.js';
import { eq, or, like } from 'drizzle-orm';

async function deepHunt() {
  console.log('--- DEEP HUNT FOR JOSHUA LOGS ---');
  
  const users = await db.select().from(authentication).where(or(like(authentication.firstName, '%Joshua%'), like(authentication.lastName, '%Joshua%')));
  
  // Collect all possible IDs for Joshua
  const userIds = new Set<string>();
  users.forEach(u => {
    if (u.employeeId) userIds.add(u.employeeId);
    userIds.add(String(u.id));
    userIds.add('001');
    userIds.add('1');
    userIds.add('Emp-001');
    userIds.add('Emp-1');
  });

  console.log('Scanning IDs:', Array.from(userIds));

  for (const id of userIds) {
    const b = await db.select().from(bioAttendanceLogs).where(eq(bioAttendanceLogs.employeeId, id));
    const a = await db.select().from(attendanceLogs).where(eq(attendanceLogs.employeeId, id));
    const d = await db.select().from(dailyTimeRecords).where(eq(dailyTimeRecords.employeeId, id));

    if (b.length || a.length || d.length) {
      console.log(`\n>>> FOUND RECORDS FOR ID: "${id}"`);
      if (b.length) console.log('Bio Logs:', b.map(x => ({id: x.id, date: x.logDate, time: x.logTime, type: x.cardType})));
      if (a.length) console.log('Att Logs:', a.map(x => ({id: x.id, time: x.scanTime, type: x.type})));
      if (d.length) console.log('DTR Logs:', d.map(x => ({id: x.id, date: x.date, in: x.timeIn, out: x.timeOut})));
    }
  }

  process.exit(0);
}

deepHunt().catch(err => {
  console.error(err);
  process.exit(1);
});
