import 'dotenv/config';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { db } from '../db/index.js';
import pool from '../db/index.js';

async function runMigrate() {
  console.log('Running migrations...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations complete!');
  } catch (err) {
    console.error('Migration failed!', err);
  } finally {
    await pool.end();
  }
}

runMigrate();
