
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Checking recruitment_jobs table structure...');
  try {
    const [rows] = await db.execute(sql`DESCRIBE recruitment_jobs;`);
    console.log('Current columns:', rows);

    const hasPostedAt = rows.toString().includes('posted_at');
    console.log('hasPostedAt', hasPostedAt);
    if (hasPostedAt) {
      console.log('Column "posted_at" ALREADY EXISTS.');
    } else {  
      console.log('Column "posted_at" IS MISSING. Adding it now...');
      await db.execute(sql`ALTER TABLE recruitment_jobs ADD COLUMN posted_at DATETIME;`);
      console.log('Column "posted_at" added successfully.');
    }
  } catch (error) {
    console.error('Error checking/modifying table:', error);
  }
  process.exit(0);
}

main();
