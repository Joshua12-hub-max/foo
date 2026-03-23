import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function showTables() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
  };

  try {
    const connection = await mysql.createConnection(config);
    const [rows] = await connection.execute('SHOW TABLES');
    const tables = (rows as never[]).map(r => Object.values(r)[0]);
    console.log('--- TABLES IN DATABASE ---');
    console.log(JSON.stringify(tables, null, 2));
    await connection.end();
  } catch (error) {
    console.error('Failed to list tables:', error);
  }
}

showTables();
