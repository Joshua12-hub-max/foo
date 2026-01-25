
import db from '../db/connection.js';
import type { RowDataPacket } from 'mysql2/promise';

const run = async () => {
  console.log('--- Checking Fingerprints Table ---');
  try {
    const [fingerprints] = await db.query<RowDataPacket[]>('SELECT * FROM fingerprints');
    console.table(fingerprints);
  } catch (e) {
    console.error('Error reading fingerprints:', e);
  }

  console.log('\n--- Checking Recent Attendance Logs (Limit 10) ---');
  try {
    const [logs] = await db.query<RowDataPacket[]>('SELECT * FROM attendance_logs ORDER BY scan_time DESC LIMIT 10');
    console.table(logs);
  } catch (e) {
    console.error('Error reading logs:', e);
  }

  console.log('\n--- Checking Employees ---');
  try {
      const [employees] = await db.query<RowDataPacket[]>('SELECT employee_id, first_name, last_name, department FROM authentication LIMIT 10');
      console.table(employees);
  } catch (e) {
      console.error('Error reading employees:', e);
  }

  process.exit(0);
};

run();
