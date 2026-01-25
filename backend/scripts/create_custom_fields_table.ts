
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function createTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connected to database.');

    const sql = `
      CREATE TABLE IF NOT EXISTS employee_custom_fields (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employee_id INT NOT NULL,
        section VARCHAR(255) NOT NULL,
        field_name VARCHAR(255) NOT NULL,
        field_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES authentication(id) ON DELETE CASCADE
      )
    `;

    await connection.execute(sql);
    console.log('Table employee_custom_fields created successfully.');

    await connection.end();
  } catch (error) {
    console.error('Error creating table:', error);
  }
}

createTable();
