import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function checkFKs() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
  });

  try {
    const [rows] = await connection.execute(`
      SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'chrmo_db' 
      AND COLUMN_NAME IN ('employee_id', 'employee_id_1', 'employee_id_2')
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('--- Foreign Keys on employee_id ---');
    (rows as never[]).forEach(row => {
        console.log(`${row.TABLE_NAME}.${row.COLUMN_NAME} -> ${row.REFERENCED_TABLE_NAME}.${row.REFERENCED_COLUMN_NAME}`);
    });
    
  } catch (error) {
    console.error('Database query failed:', error);
  } finally {
    await connection.end();
  }
}

checkFKs().catch(console.error);
