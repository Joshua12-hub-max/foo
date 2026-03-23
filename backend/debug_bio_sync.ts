import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function debugBiometricSync() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
  });

  try {
    console.log('--- BIOMETRIC SYNC DEBUG ---');

    // 1. Check total logs
    const [bioLogsCountRows] = await connection.execute('SELECT COUNT(*) as count FROM bio_attendance_logs');
    const [attLogsCountRows] = await connection.execute('SELECT COUNT(*) as count FROM attendance_logs WHERE source = "BIOMETRIC"');
    console.log(`Total Bio Logs: ${(bioLogsCountRows as never)[0].count}`);
    console.log(`Total Synced Att Logs: ${(attLogsCountRows as never)[0].count}`);

    // 2. Check for latest logs
    console.log('\nLatest 5 Bio Logs:');
    const [latestBio] = await connection.execute('SELECT * FROM bio_attendance_logs ORDER BY id DESC LIMIT 5');
    console.table(latestBio);

    console.log('\nLatest 5 Attendance Logs (Biometric):');
    const [latestAtt] = await connection.execute('SELECT * FROM attendance_logs WHERE source = "BIOMETRIC" ORDER BY id DESC LIMIT 5');
    console.table(latestAtt);

    // 3. Check for orphan logs (logs with IDs not in authentication table)
    console.log('\nChecking for ID mismatches:');
    const [orphans] = await connection.execute(`
      SELECT DISTINCT b.employee_id 
      FROM bio_attendance_logs b
      LEFT JOIN authentication a ON b.employee_id = a.employee_id
      WHERE a.employee_id IS NULL
    `);
    if ((orphans as never[]).length > 0) {
      console.warn('Found Biometric IDs that DO NOT exist in Authentication table:');
      console.table(orphans);
    } else {
      console.log('All biometric IDs have matching accounts.');
    }

    // 4. Check for enrollment status
    console.log('\nEnrolled Users in Bio System:');
    const [enrolled] = await connection.execute('SELECT id, fullName, department FROM bio_enrolled_users LIMIT 10');
    console.table(enrolled);

  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await connection.end();
  }
}

debugBiometricSync().catch(console.error);
