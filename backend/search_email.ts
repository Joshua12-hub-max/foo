import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function searchEmail() {
  const email = 'primeagen5@gmail.com';
  console.log(`--- SEARCHING FOR EMAIL: ${email} IN ALL TABLES ---`);

  const tables = await db.execute(sql`SHOW TABLES`);
  const tableNames = tables[0].map((t: any) => Object.values(t)[0]);

  for (const tableName of tableNames) {
    try {
      // Check if table has email column
      const columns = await db.execute(sql`SHOW COLUMNS FROM ${sql.identifier(tableName)}`);
      const hasEmail = columns[0].some((c: any) => c.Field.toLowerCase().includes('email'));
      
      if (hasEmail) {
        const results = await db.execute(sql`SELECT * FROM ${sql.identifier(tableName)} WHERE email = ${email}`);
        if (results[0].length > 0) {
          console.log(`FOUND IN TABLE: ${tableName}`);
          console.log(JSON.stringify(results[0], null, 2));
        }
      }
    } catch (err) {
      // console.warn(`Error checking table ${tableName}`);
    }
  }

  process.exit(0);
}

searchEmail().catch(err => {
  console.error(err);
  process.exit(1);
});
