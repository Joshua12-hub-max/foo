import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import dotenv from 'dotenv';
import * as schema from './schema.js';
import * as relations from './relations.js';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import path from 'path';
import { fileURLToPath } from 'url';
import { MySQLError } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const combinedSchema = { ...schema, ...relations };

dotenv.config();

const poolConfig: PoolOptions = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chrmo_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  charset: 'utf8mb4'
};

const pool: Pool = mysql.createPool(poolConfig);

// Initialize Drizzle
export const db = drizzle(pool, { schema: combinedSchema, mode: 'default' });

/**
 * Retries database connection until successful or max attempts reached.
 */
export const waitForDatabase = async (maxAttempts = 10, delayMs = 3000): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const connection = await pool.getConnection();
      console.warn('Database connected successfully');
      connection.release();
      return true;
    } catch (error) {
      const err = error as Error;
      console.error(`Database connection attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
      if (attempt < maxAttempts) {
        console.warn(`Retrying in ${delayMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  return false;
};

// Initial connection check
waitForDatabase(1); // Non-blocking initial check for logs

/**
 * Runs pending migrations to ensure database schema is up-to-date.
 */
export const runMigrations = async () => {
  console.warn('Running migrations...');
  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, '../drizzle'),
    });
    console.warn('Migrations completed successfully');
  } catch (error) {
    const err = error as MySQLError;
    // Check if the error is "Table already exists" (MySQL error code 1050 / sqlState 42S01)
    if (
      err.sqlState === '42S01' || 
      err.code === 'ER_TABLE_EXISTS_ERROR' || 
      err.code === 'ER_DUP_FIELDNAME' ||
      err.message.includes("already exists") ||
      (err.sqlMessage && err.sqlMessage.includes("already exists")) ||
      err.toString().includes("already exists")
    ) {
      console.warn('Database schema is already partially or fully initialized. Skipping creation steps.');
      return;
    }
    
    // Deeper check for wrapped Drizzle/MySQL errors
    const errorString = err.toString().toLowerCase();
    const sqlMessage = (err.sqlMessage || err.message || '').toLowerCase();
    const errorCode = String(err.code || '');
    
    if (
      errorString.includes("already exists") || 
      errorString.includes("duplicate column") ||
      sqlMessage.includes("already exists") ||
      sqlMessage.includes("duplicate column") ||
      errorCode === '1050' || // ER_TABLE_EXISTS_ERROR
      errorCode === '1060' || // ER_DUP_FIELDNAME
      err.sqlState === '42S01' || // Table already exists
      err.sqlState === '42S21'    // Duplicate column name
    ) {
      console.warn('Database schema conflict detected (already existing). Skipping.');
      return;
    }
    
    console.error('Migration failed!');
    console.error('Error Details:', {
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      message: err.message,
      sqlMessage: err.sqlMessage
    });
    if (err.sql) console.error('Failed SQL:', err.sql);
  }
};

export default pool;
