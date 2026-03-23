import { db } from '../db/index.js';
import { bioEnrolledUsers, bioAttendanceLogs } from '../db/schema.js';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('Starting Biometric ID normalization...');

  try {
    // 1. Normalize bio_enrolled_users
    console.log('Normalizing bio_enrolled_users.employee_id...');
    await db.execute(sql`
      UPDATE bio_enrolled_users 
      SET employee_id = REGEXP_REPLACE(employee_id, '[^0-9]', '')
      WHERE employee_id REGEXP '[^0-9]'
    `);

    // 2. Normalize bio_attendance_logs
    console.log('Normalizing bio_attendance_logs.employee_id...');
    await db.execute(sql`
      UPDATE bio_attendance_logs 
      SET employee_id = REGEXP_REPLACE(employee_id, '[^0-9]', '')
      WHERE employee_id REGEXP '[^0-9]'
    `);

    console.log('Normalization complete!');
  } catch (error) {
    console.error('Normalization failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
