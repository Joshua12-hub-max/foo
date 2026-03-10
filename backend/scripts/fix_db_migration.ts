import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function fix() {
  try {
    console.log('Renaming column education to educational_background...');
    await db.execute(sql`ALTER TABLE recruitment_applicants CHANGE COLUMN education educational_background TEXT`);
    console.log('Successfully renamed column.');
  } catch (error) {
    console.error('Error during fix:', error);
    try {
        console.log('Trying RENAME COLUMN syntax...');
        await db.execute(sql`ALTER TABLE recruitment_applicants RENAME COLUMN education TO educational_background`);
        console.log('Successfully renamed column using RENAME COLUMN.');
    } catch (innerError) {
        console.error('Failed both syntax options. Maybe it is already renamed?', innerError);
    }
  }
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
