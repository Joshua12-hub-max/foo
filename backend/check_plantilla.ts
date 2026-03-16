import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function checkPlantilla() {
  try {
    const result = await db.execute(sql`DESCRIBE plantilla_positions`);
    console.table(result[0]);
  } catch (error) {
    console.error('Error checking plantilla:', error);
  } finally {
    process.exit(0);
  }
}

checkPlantilla();
