import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function checkSchema() {
  try {
    const [rows] = await db.execute(sql`SHOW CREATE TABLE pds_personal_information`);
    console.log('Schema for pds_personal_information:', rows);
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

checkSchema();
