import 'dotenv/config';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('Truncating daily time records and schedules...');
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
    await db.execute(sql`TRUNCATE TABLE daily_time_records;`);
    await db.execute(sql`TRUNCATE TABLE schedules;`);
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);
    console.log('Truncation complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
