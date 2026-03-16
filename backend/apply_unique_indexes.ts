import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function applyUniqueIndexes() {
  try {
    console.log('Applying unique indexes to authentication table...');
    const authCols = ['umid_no', 'philsys_id', 'philhealth_number', 'pagibig_number', 'tin_number', 'gsis_number'];
    for (const col of authCols) {
        try {
            await db.execute(sql.raw("CREATE UNIQUE INDEX " + col + "_unique ON authentication (" + col + ")"));
            console.log("Added unique index for " + col + " in authentication");
        } catch (e: any) {
            if (e.code === 'ER_DUP_KEYNAME') console.log("Index " + col + "_unique already exists");
            else console.error("Warning on " + col + ": ", e.message);
        }
    }

    console.log('Applying unique indexes to recruitment_applicants table...');
    const reqCols = ['email', 'umid_no', 'philsys_id', 'philhealth_no', 'pagibig_no', 'tin_no', 'gsis_no'];
    for (const col of reqCols) {
        try {
            await db.execute(sql.raw("CREATE UNIQUE INDEX " + col + "_unique ON recruitment_applicants (" + col + ")"));
            console.log("Added unique index for " + col + " in recruitment_applicants");
        } catch (e: any) {
            if (e.code === 'ER_DUP_KEYNAME') console.log("Index " + col + "_unique already exists");
            else console.error("Warning on " + col + ": ", e.message);
        }
    }

    console.log('Unique indexes applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

applyUniqueIndexes();
