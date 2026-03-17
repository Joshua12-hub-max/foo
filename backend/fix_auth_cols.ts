import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const res = await db.execute(sql`SHOW COLUMNS FROM authentication`);
    const columns = res[0] as unknown as any[];
    const colNames = columns.map((c: any) => c.Field);
    
    const targets = [
        { name: 'is_meycauayan', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'date_accomplished', type: 'DATE' },
        { name: 'pds_questions', type: 'JSON' }
    ];

    for (const target of targets) {
        if (!colNames.includes(target.name)) {
            console.log(`Column ${target.name} is missing. Attempting to add...`);
            await db.execute(sql`ALTER TABLE authentication ADD COLUMN ${sql.raw(target.name)} ${sql.raw(target.type)}`);
            console.log(`Column ${target.name} added successfully.`);
        } else {
            console.log(`Column ${target.name} already exists.`);
        }
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}
run();
