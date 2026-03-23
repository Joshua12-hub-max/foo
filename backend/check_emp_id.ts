import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function checkEmpIds() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
  });

  try {
    const [rows] = await connection.execute(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'chrmo_db' 
      AND (COLUMN_NAME = 'employee_id' OR COLUMN_NAME LIKE '%employee%id%')
    `);
    
    console.log('--- Tables containing Employee ID ---');
    (rows as never[]).forEach(row => {
        console.log(`${row.TABLE_NAME}.${row.COLUMN_NAME} (${row.DATA_TYPE}(${row.CHARACTER_MAXIMUM_LENGTH || ''}))`);
    });
    
  } catch (error) {
    console.error('Database query failed:', error);
  } finally {
    await connection.end();
  }
}

checkEmpIds().catch(console.error);
