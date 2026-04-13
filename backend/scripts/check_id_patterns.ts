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

async function checkIds() {
  console.log('--- ID PATTERN REGISTRY ---');
  for (const table of tables) {
    try {
      const columnName = table === 'recruitment_applicants' ? 'registered_employee_id' : 'employee_id';
      
      const counts = await db.execute(sql.raw(`
        SELECT 
          CASE 
            WHEN ${columnName} IS NULL THEN 'NULL'
            WHEN ${columnName} NOT LIKE 'Emp-%' THEN 'Non-Emp'
            WHEN LENGTH(${columnName}) = 7 THEN 'Standard (Emp-XXX)'
            ELSE 'Legacy (Emp-Long)'
          END as pattern,
          COUNT(*) as count
        FROM ${table}
        GROUP BY pattern
      `));
      
      console.log(`Table: ${table}`);
      console.log(counts[0]);
    } catch (e: any) {
        // ignore tables that don't have the column
    }
  }
  process.exit(0);
}

checkIds();
