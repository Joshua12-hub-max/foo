import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function auditEmp002() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
  });

  const empId = 'Emp-002';

  try {
    console.log(`--- 100% Audit Report for ${empId} ---`);

    // 1. Raw Biometric Logs
    const [bioLogs] = await connection.execute(
      'SELECT * FROM bio_attendance_logs WHERE employee_id = ? ORDER BY log_date DESC, log_time DESC LIMIT 10',
      [empId]
    );
    console.log('\n[1] bio_attendance_logs (Raw Hardware Scans):');
    console.table(bioLogs);

    // 2. HR Attendance Logs
    const [hrLogs] = await connection.execute(
      'SELECT * FROM attendance_logs WHERE employee_id = ? ORDER BY scan_time DESC LIMIT 10',
      [empId]
    );
    console.log('\n[2] attendance_logs (Middleware Primary Logs):');
    console.table(hrLogs);

    // 3. Consolidated DTR
    const [dtrRecords] = await connection.execute(
      'SELECT * FROM daily_time_records WHERE employee_id = ? ORDER BY date DESC LIMIT 5',
      [empId]
    );
    console.log('\n[3] daily_time_records (Final HR Report):');
    console.table(dtrRecords);

    // 4. Check Authentication table format
    const [authData] = await connection.execute(
      'SELECT id, employee_id, firstName, lastName FROM authentication WHERE (employee_id = ? OR id = 2)',
      [empId]
    );
    console.log('\n[4] authentication (Identity Check):');
    console.table(authData);

  } catch (error) {
    console.error('Audit failed:', error);
  } finally {
    await connection.end();
  }
}

auditEmp002();
