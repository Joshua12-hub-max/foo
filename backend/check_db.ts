import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function checkColumns() {
  try {
    const authColumns = await db.execute(sql`SHOW COLUMNS FROM authentication LIKE '%school_name%';`);
    const authColumns2 = await db.execute(sql`SHOW COLUMNS FROM authentication LIKE '%course%';`);
    const authColumns3 = await db.execute(sql`SHOW COLUMNS FROM authentication LIKE '%year_graduated%';`);

    const recruitColumns = await db.execute(sql`SHOW COLUMNS FROM recruitment_applicants LIKE '%school_name%';`);
    const recruitColumns2 = await db.execute(sql`SHOW COLUMNS FROM recruitment_applicants LIKE '%course%';`);
    const recruitColumns3 = await db.execute(sql`SHOW COLUMNS FROM recruitment_applicants LIKE '%year_graduated%';`);

    console.log('--- Authentication Table ---');
    console.log('school_name exists:', authColumns[0].length > 0);
    console.log('course exists:', authColumns2[0].length > 0);
    console.log('year_graduated exists:', authColumns3[0].length > 0);

    console.log('');
    console.log('--- Recruitment Applicants Table ---');
    console.log('school_name exists:', recruitColumns[0].length > 0);
    console.log('course exists:', recruitColumns2[0].length > 0);
    console.log('year_graduated exists:', recruitColumns3[0].length > 0);

    process.exit(0);
  } catch (err) {
    console.error('Error checking columns:', err);
    process.exit(1);
  }
}

checkColumns();
