import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function checkHrSchema() {
  try {
    const [rows] = await db.execute(sql`SHOW CREATE TABLE pds_hr_details`);
    console.log('Schema for pds_hr_details:', rows);
  } catch (error) {
    console.error('Error checking HR schema:', error);
  }
}

checkHrSchema();
