import { db } from '../db/index.js';
import { authentication, schedules } from '../db/schema.js';
import { sql } from 'drizzle-orm';

const WORK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const START_TIME = '08:00:00';
const END_TIME = '17:00:00';
const SCHEDULE_TITLE = 'Regular Schedule';

async function seedSchedules() {
  console.log('=== SEEDING SCHEDULES ===');

  try {
    // 1. Get all employees
    const employees = await db.select({
      employeeId: authentication.employeeId,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
    }).from(authentication);

    if (employees.length === 0) {
      console.error('❌ No employees found. Run seed_chrmo.ts first.');
      process.exit(1);
    }

    console.log(`Found ${employees.length} employees.`);

    // 2. Clear existing schedules to avoid duplicates
    await db.execute(sql`TRUNCATE TABLE schedules`);
    console.log('Cleared existing schedules.');

    // 3. Insert Mon-Fri schedule for each employee
    let inserted = 0;
    for (const emp of employees) {
      for (const day of WORK_DAYS) {
        try {
          await db.insert(schedules).values({
            employeeId: emp.employeeId,
            scheduleTitle: SCHEDULE_TITLE,
            dayOfWeek: day,
            startTime: START_TIME,
            endTime: END_TIME,
            repeatPattern: 'Weekly',
          } as any);
          inserted++;
        } catch (err: any) {
          console.error(`Error inserting schedule for ${emp.employeeId} on ${day}:`, err.message);
        }
      }
    }

    console.log(`✅ Inserted ${inserted} schedule entries (${employees.length} employees × ${WORK_DAYS.length} days).`);

    // 4. Verify
    const [countResult]: any = await db.execute(sql`SELECT COUNT(*) as count FROM schedules`);
    console.log(`Verification: ${countResult[0].count} rows in schedules table.`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

seedSchedules();
