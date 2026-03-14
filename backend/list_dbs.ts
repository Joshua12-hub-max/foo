import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function listDatabases() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  try {
    const connection = await mysql.createConnection(config);
    const [rows] = await connection.execute('SHOW DATABASES;');
    console.log('--- AVAILABLE DATABASES ---');
    (rows as any[]).forEach(row => console.log(row.Database));
    await connection.end();
  } catch (error) {
    console.error('Failed to list databases:', error);
  }
}

listDatabases();
