import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

const tables = [
  'attendance_logs',
  'daily_time_records',
  'bio_enrolled_users',
  'bio_attendance_logs',
  'dtr_corrections',
  'fingerprints',
  'schedules',
  'authentication',
  'leave_applications',
  'leave_balances',
  'leave_credits',
  'leave_ledger',
  'leave_monetization_requests',
  'lwop_summary',
  'tardiness_summary',
  'policy_violations',
  'recruitment_applicants'
];

async function standardizeIds() {
  console.log('--- STARTING ID STANDARDIZATION MIGRATION ---');

  for (const table of tables) {
    try {
      console.log(`Processing table: ${table}...`);
      
      const columnName = table === 'recruitment_applicants' ? 'registered_employee_id' : 'employee_id';
      
      const query = sql.raw(`
        UPDATE IGNORE ${table} 
        SET ${columnName} = CONCAT('Emp-', LPAD(REGEXP_REPLACE(${columnName}, '[^0-9]', ''), 3, '0'))
        WHERE ${columnName} LIKE 'Emp-%'
      `);

      const result = await db.execute(query);
      
      // Cleanup: After IGNORE, delete any remaining legacy IDs that couldn't be updated due to clash
      const cleanupQuery = sql.raw(`
        DELETE FROM ${table}
        WHERE ${columnName} LIKE 'Emp-%'
        AND LENGTH(${columnName}) > 7
      `);
      await db.execute(cleanupQuery);
      
      console.log(`Successfully updated and cleaned ${table}.`);
    } catch (error: any) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
          console.warn(`Table ${table} does not exist. Skipping.`);
      } else if (error.message.includes("Unknown column")) {
          console.warn(`Column not found in ${table}. Skipping.`);
      } else {
          console.error(`Error updating ${table}:`, error.message);
      }
    }
  }

  console.log('--- MIGRATION COMPLETE ---');
  process.exit(0);
}

standardizeIds();
