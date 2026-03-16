import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const resAuth = await db.execute(sql`DESCRIBE authentication`);
    console.log('--- authentication ---');
    console.table(resAuth[0]);

    const resRec = await db.execute(sql`DESCRIBE recruitment_applicants`);
    console.log('--- recruitment_applicants ---');
    console.table(resRec[0]);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();