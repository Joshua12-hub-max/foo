import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function migrateEmpIds() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
  });

  const tables = [
    'attendance_logs',
    'authentication',
    'bio_attendance_logs',
    'bio_enrolled_users',
    'daily_time_records',
    'dtr_corrections',
    'fingerprints',
    'leave_applications',
    'leave_balances',
    'leave_credits',
    'leave_ledger',
    'leave_monetization_requests',
    'leave_requests',
    'lwop_summary',
    'policy_violations',
    'schedules',
    'service_records',
    'tardiness_summary'
  ];

  try {
    await connection.beginTransaction();

    let totalUpdated = 0;

    for (const table of tables) {
      console.log(`Processing ${table}...`);
      
      // Update query that pads numeric IDs.
      // E.g., '1' -> 'Emp-001', '12' -> 'Emp-012', '123' -> 'Emp-123'
      // Only targets fields that are purely numerical (don't have 'Emp-' prefix already).
      const [result] = await connection.execute(`
        UPDATE \`${table}\` 
        SET employee_id = CONCAT('Emp-', LPAD(employee_id, 3, '0'))
        WHERE employee_id REGEXP '^[0-9]+$'
      `);

      const changed = (result as any).affectedRows || 0;
      totalUpdated += changed;
      
      if (changed > 0) {
        console.log(`  Updated ${changed} rows in ${table}`);
      }
    }

    await connection.commit();
    console.log(`\nMigration complete. Total rows updated: ${totalUpdated}`);

  } catch (error) {
    await connection.rollback();
    console.error('Migration failed. Rolled back.', error);
  } finally {
    await connection.end();
  }
}

migrateEmpIds().catch(console.error);
