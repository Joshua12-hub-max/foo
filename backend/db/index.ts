import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import dotenv from 'dotenv';
import * as schema from './schema.js';
import * as relations from './relations.js';

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
  multipleStatements: true
};

const pool: Pool = mysql.createPool(poolConfig);

// Initialize Drizzle
export const db = drizzle(pool, { schema: combinedSchema, mode: 'default' });

const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (error) {
    const err = error as Error;
    console.error('Database connection failed:', err.message);
  }
};

testConnection();

export default pool;
