import mysql, { Pool, PoolOptions, RowDataPacket } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const poolConfig: PoolOptions = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chrmo_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool: Pool = mysql.createPool(poolConfig);

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
