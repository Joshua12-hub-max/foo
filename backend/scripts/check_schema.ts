import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306')
  });

  try {
    const [columns] = await connection.query('DESCRIBE recruitment_applicants');
    console.log('Schema for recruitment_applicants:');
    console.log(JSON.stringify(columns, null, 2));
  } catch (error) {
    console.error('Error fetching schema:', error);
  } finally {
    await connection.end();
  }
}

checkSchema();
