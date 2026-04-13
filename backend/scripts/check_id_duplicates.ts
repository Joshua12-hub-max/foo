import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function checkDuplicates() {
  const tablesWithUniques = [
    { table: 'tardiness_summary', columns: ['employee_id', 'year', 'month'] },
    { table: 'authentication', columns: ['employee_id'] },
    { table: 'leave_balances', columns: ['employee_id', 'credit_type', 'year'] },
    { table: 'leave_credits', columns: ['employee_id', 'credit_type'] },
    { table: 'lwop_summary', columns: ['employee_id', 'year'] }
  ];

  console.log('--- CHECKING FOR POTENTIAL DUPLICATES AFTER NORMALIZATION ---');

  for (const { table, columns } of tablesWithUniques) {
    const colsSql = columns.map(c => c === 'employee_id' ? `CONCAT('Emp-', LPAD(REGEXP_REPLACE(employee_id, '[^0-9]', ''), 3, '0'))` : `\`${c}\``).join(', ');
    const query = sql.raw(`
      SELECT ${colsSql}, COUNT(*) as count 
      FROM ${table} 
      GROUP BY ${colsSql} 
      HAVING count > 1
    `);

    try {
      const results = await db.execute(query);
      if (results[0].length > 0) {
        console.log(`Table ${table} would have ${results[0].length} duplicate group(s) after normalization.`);
        console.log(JSON.stringify(results[0], null, 2));
      } else {
        console.log(`Table ${table} is safe for normalization.`);
      }
    } catch (err: any) {
      console.error(`Error checking ${table}:`, err.message);
    }
  }
  process.exit(0);
}

checkDuplicates();
