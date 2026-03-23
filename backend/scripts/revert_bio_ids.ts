import { db } from '../db/index.js';
import { bioEnrolledUsers, bioAttendanceLogs } from '../db/schema.js';
import { sql } from 'drizzle-orm';

async function revert() {
  console.log('Reverting Biometric ID normalization (Restoring Emp-XXX format)...');

  try {
    // 1. Restore bio_enrolled_users.employee_id
    console.log('Restoring bio_enrolled_users.employee_id...');
    await db.execute(sql`
      UPDATE bio_enrolled_users 
      SET employee_id = CONCAT('Emp-', LPAD(employee_id, 3, '0'))
      WHERE employee_id NOT LIKE 'Emp-%' AND employee_id REGEXP '^[0-9]+$'
    `);

    // 2. Restore bio_attendance_logs.employee_id
    console.log('Restoring bio_attendance_logs.employee_id...');
    await db.execute(sql`
      UPDATE bio_attendance_logs 
      SET employee_id = CONCAT('Emp-', LPAD(employee_id, 3, '0'))
      WHERE employee_id NOT LIKE 'Emp-%' AND employee_id REGEXP '^[0-9]+$'
    `);

    console.log('Revert complete!');
  } catch (error) {
    console.error('Revert failed:', error);
  } finally {
    process.exit(0);
  }
}

revert();
