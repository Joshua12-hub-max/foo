import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function identifyTarget() {
  console.log(`--- BROAD SEARCH FOR ID 7 / 007 ---`);
  
  // 1. Check Authentication table for similar IDs
  const [auth] = await db.execute(sql.raw(`SELECT first_name, last_name, employee_id, role FROM authentication WHERE employee_id LIKE '%7%'`));
  console.log('Authentication Table (containing 7):', auth);

  // 2. Check PDS details (sometimes stored differently)
  const [personal] = await db.execute(sql.raw(`SELECT * FROM pds_personal_information WHERE agency_employee_no LIKE '%7%'`));
  console.log('PDS Agency Number (containing 7):', personal);

  process.exit(0);
}

identifyTarget();
