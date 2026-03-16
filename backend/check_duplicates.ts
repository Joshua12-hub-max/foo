import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function checkDuplicates() {
  try {
    const authCols = ['umid_no', 'philhealth_number', 'pagibig_number', 'tin_number', 'gsis_number'];
    for (const col of authCols) {
        const result = await db.execute(sql.raw(`SELECT ${col}, COUNT(*) as c FROM authentication WHERE ${col} IS NOT NULL GROUP BY ${col} HAVING c > 1`));
        console.log(`Duplicates for ${col}:`, result[0]);
    }
  } catch (error) {
    console.error('Check failed:', error);
  } finally {
    process.exit(0);
  }
}

checkDuplicates();