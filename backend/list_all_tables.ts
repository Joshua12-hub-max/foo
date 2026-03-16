import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function listTables() {
  try {
    const result = await db.execute(sql`SHOW TABLES`);
    console.log('Tables in database:');
    console.table(result[0]);
  } catch (error) {
    console.error('Error listing tables:', error);
  } finally {
    process.exit(0);
  }
}

listTables();
