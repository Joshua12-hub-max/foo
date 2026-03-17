import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const res = await db.execute(sql`SHOW COLUMNS FROM authentication`);
    const columns = res[0] as unknown as any[];
    const hasColumn = columns.some((c: any) => c.Field === 'is_meycauayan');
    console.log('Has is_meycauayan:', hasColumn);
    if (!hasColumn) {
        console.log('Column is missing. Attempting to add...');
        await db.execute(sql`ALTER TABLE authentication ADD COLUMN is_meycauayan BOOLEAN DEFAULT FALSE`);
        console.log('Column added successfully.');
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}
run();
