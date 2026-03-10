import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import _fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function syncMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
  });

  try {
    console.warn('Ensuring __drizzle_migrations table exists...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `);

    // Check if 0000 migration is already there
    const [rows] = await connection.execute('SELECT * FROM __drizzle_migrations WHERE id = 1');
    if ((rows as unknown[]).length > 0) {
      console.warn('Migration 0000 already recorded in __drizzle_migrations.');
    } else {
      console.warn('Recording migration 0000 in __drizzle_migrations...');
      // Use a dummy hash and current timestamp for the record
      // This tells Drizzle that the first migration is already applied
      await connection.execute(
        'INSERT INTO __drizzle_migrations (id, hash, created_at) VALUES (?, ?, ?)',
        [1, 'manual_sync_0000_graceful_hobgoblin', Date.now()]
      );
      console.warn('Migration 0000 successfully synchronized.');
    }
  } catch (error) {
    console.error('Failed to synchronize migrations:', error);
  } finally {
    await connection.end();
  }
}

syncMigrations().catch(console.error);
