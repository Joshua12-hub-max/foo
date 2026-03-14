import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function checkIndex() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
  });

  try {
    const [rows] = await connection.execute('SHOW INDEX FROM policy_violations');
    console.table(rows);
  } catch (error) {
    console.error('Database query failed:', error);
  } finally {
    await connection.end();
  }
}

checkIndex().catch(console.error);
