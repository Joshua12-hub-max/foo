import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('Updating pds_hr_details table with missing columns (Standard SQL)...');

  const addColumns = [
    'ALTER TABLE pds_hr_details ADD COLUMN department_id INT',
    'ALTER TABLE pds_hr_details ADD COLUMN position_id INT',
    'ALTER TABLE pds_hr_details ADD COLUMN manager_id INT'
  ];

  for (const query of addColumns) {
    try {
      await connection.execute(query);
      console.log(`Executed: ${query}`);
    } catch (e) {
      console.warn(`Already exists or error: ${err.message}`);
    }
  }

  const addFKs = [
    'ALTER TABLE pds_hr_details ADD CONSTRAINT fk_hr_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL',
    'ALTER TABLE pds_hr_details ADD CONSTRAINT fk_hr_position FOREIGN KEY (position_id) REFERENCES plantilla_positions(id) ON DELETE SET NULL',
    'ALTER TABLE pds_hr_details ADD CONSTRAINT fk_hr_manager FOREIGN KEY (manager_id) REFERENCES authentication(id) ON DELETE SET NULL'
  ];

  for (const query of addFKs) {
    try {
      await connection.execute(query);
      console.log(`Executed: ${query}`);
    } catch (e) {
      console.warn(`Already exists or error: ${err.message}`);
    }
  }

  console.log('Table pds_hr_details updated.');
  await connection.end();
}

main().catch(console.error);
