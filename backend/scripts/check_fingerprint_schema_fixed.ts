
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkFingerprintSchema() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('--- FINGERPRINTS SCHEMA ---');
    const [schema] = await connection.execute("DESCRIBE fingerprints");
    console.table(schema);

    console.log('\n--- FINGERPRINTS CREATE TABLE ---');
    const [createTable]: any = await connection.execute("SHOW CREATE TABLE fingerprints");
    console.log(createTable[0]['Create Table']);

    console.log('\n--- FINGERPRINTS DATA (Limit 10) ---');
    const [data] = await connection.execute("SELECT * FROM fingerprints LIMIT 10");
    console.table(data);

    await connection.end();
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkFingerprintSchema();
