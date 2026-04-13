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

async function purgeGhostId() {
  const ghostId = 'Emp-007';
  console.log(`--- PURGING ${ghostId} FROM DATABASE ---`);

  for (const table of tables) {
    try {
      console.log(`Purging from ${table}...`);
      const columnName = table === 'recruitment_applicants' ? 'registered_employee_id' : 'employee_id';
      
      const query = sql.raw(`DELETE FROM ${table} WHERE ${columnName} = '${ghostId}'`);
      const result = await db.execute(query) as any;
      console.log(`Successfully purged ${table}. Rows affected: ${result[0]?.affectedRows || 0}`);
    } catch (error: any) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
          // ignore
      } else if (error.message.includes("Unknown column")) {
          // ignore
      } else {
          console.error(`Error purging ${table}:`, error.message);
      }
    }
  }

  console.log('--- PURGE COMPLETE ---');
  process.exit(0);
}

purgeGhostId();
