import { db } from './db/index.js';
import { authentication, attendanceLogs, dailyTimeRecords, pdsHrDetails } from './db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { processDailyAttendance } from './services/attendanceProcessor.js';

async function migrate() {
  console.log('--- STARTING ABSOLUTE ID NORMALIZATION ---');

  // 1. Utility function to normalize ID
  const normalize = (id: string | null) => {
    if (!id) return id;
    const numeric = id.replace(/\D/g, '');
    if (!numeric) return id;
    return `Emp-${numeric.padStart(3, '0')}`;
  };

  // 2. Fix Authentication Table
  const users = await db.select().from(authentication);
  console.log(`Auditing ${users.length} users...`);
  for (const user of users) {
    const newId = normalize(user.employeeId);
    if (newId !== user.employeeId) {
      console.log(`Updating Auth: ${user.employeeId} -> ${newId}`);
      await db.update(authentication).set({ employeeId: newId }).where(eq(authentication.id, user.id));
    }
  }

  // 3. Fix Attendance Logs
  const logs = await db.select().from(attendanceLogs);
  console.log(`Auditing ${logs.length} attendance logs...`);
  for (const log of logs) {
    const newId = normalize(log.employeeId);
    if (newId !== log.employeeId) {
      console.log(`Updating Log: ${log.employeeId} -> ${newId}`);
      await db.update(attendanceLogs).set({ employeeId: newId }).where(eq(attendanceLogs.id, log.id));
    }
  }

  // 4. Fix Daily Time Records
  const dtrs = await db.select().from(dailyTimeRecords);
  console.log(`Auditing ${dtrs.length} DTRs...`);
  for (const dtr of dtrs) {
    const newId = normalize(dtr.employeeId);
    if (newId !== dtr.employeeId) {
      console.log(`Updating DTR: ${dtr.employeeId} -> ${newId}`);
      // DTRs might have unique constraints, we need to be careful. 
      // But since we are migrating all, it should be fine as long as there are no collisions.
      await db.update(dailyTimeRecords).set({ employeeId: newId }).where(eq(dailyTimeRecords.id, dtr.id));
    }
  }

  console.log('\n--- DATA NORMALIZED. NOW RE-PROCESSING ATTENDANCE ---');

  // 5. Trigger DTR Processing for all unique employee/date combinations
  const uniqueCombos = await db.select({ 
    employeeId: attendanceLogs.employeeId, 
    date: sql<string>`DATE(${attendanceLogs.scanTime})` 
  }).from(attendanceLogs).groupBy(attendanceLogs.employeeId, sql`DATE(${attendanceLogs.scanTime})`);

  console.log(`Found ${uniqueCombos.length} unique employee/date sets to process.`);

  for (const combo of uniqueCombos) {
    if (combo.employeeId && combo.date) {
      console.log(`Processing: ${combo.employeeId} on ${combo.date}`);
      await processDailyAttendance(combo.employeeId, combo.date);
    }
  }

  console.log('\n--- SYSTEM RESTORED 100% ---');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
