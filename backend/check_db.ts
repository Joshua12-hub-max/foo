import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
  });

  const columnsToCheck = [
    { table: 'budget_allocation', columns: ['remaining_budget', 'utilization_rate'] },
    { table: 'leave_applications', columns: ['attachment_path', 'medical_certificate_path', 'admin_form_path', 'final_attachment_path'] },
    { table: 'leave_requests', columns: ['attachment_path', 'admin_form_path', 'final_attachment_path'] },
    { table: 'authentication', columns: ['philhealth_no', 'pagibig_id_no', 'tin_no', 'gsis_id_no', 'highest_education'] },
    { table: 'google_calendar_tokens', columns: ['refreshToken'] },
    { table: 'social_connections', columns: ['refreshToken'] },
    { table: 'recruitment_applicants', columns: ['education'] },
    { table: 'policy_violations', columns: ['memoId'] }
  ];

  try {
    for (const { table, columns } of columnsToCheck) {
      console.log(`\nTable: ${table}`);
      const [rows] = await connection.execute(`SHOW COLUMNS FROM ${table}`);
      const existingColumns = (rows as any[]).map(row => row.Field);
      
      for (const col of columns) {
        if (existingColumns.includes(col)) {
          console.log(`  [EXISTS] ${col}`);
        } else {
          console.log(`  [MISSING] ${col}`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to check schema:', error);
  } finally {
    await connection.end();
  }
}

checkSchema().catch(console.error);
