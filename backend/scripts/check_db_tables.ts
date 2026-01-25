
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkTables() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connected to database.');

    const [rows] = await connection.execute("SHOW TABLES");
    console.log('Tables:', rows);

    try {
        const [schema] = await connection.execute("DESCRIBE employees");
        console.log('Employees Schema:', schema);
    } catch (e: any) {
        console.log("Could not describe employees table:", e.message);
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();
