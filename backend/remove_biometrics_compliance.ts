import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function removeColumns() {
  console.log('--- Removing Biometrics and Compliance Columns from Database ---');
  try {
    // MySQL syntax to drop multiple columns
    await db.execute(sql`
      ALTER TABLE authentication 
      DROP COLUMN IF EXISTS right_thumbmark_url,
      DROP COLUMN IF EXISTS ctc_no,
      DROP COLUMN IF EXISTS ctc_issued_at,
      DROP COLUMN IF EXISTS ctc_issued_date
    `);
    console.log('Successfully dropped columns: right_thumbmark_url, ctc_no, ctc_issued_at, ctc_issued_date');
  } catch (error) {
    console.error('Failed to drop columns:', error);
    // Fallback for older MySQL versions that don't support DROP COLUMN IF EXISTS
    console.log('Attempting individual drops...');
    const columns = ['right_thumbmark_url', 'ctc_no', 'ctc_issued_at', 'ctc_issued_date'];
    for (const col of columns) {
      try {
        await db.execute(sql`ALTER TABLE authentication DROP COLUMN ${sql.raw(col)}`);
        console.log(`Dropped ${col}`);
      } catch (e) {
        console.log(`Could not drop ${col} (likely already gone)`);
      }
    }
  }
  process.exit(0);
}

removeColumns();
