import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function listTables() {
  console.log('--- DATABASE TABLES ---');
  const tables = await db.execute(sql`SHOW TABLES`);
  console.log(JSON.stringify(tables, null, 2));
  process.exit(0);
}

listTables().catch(err => {
  console.error(err);
  process.exit(1);
});
