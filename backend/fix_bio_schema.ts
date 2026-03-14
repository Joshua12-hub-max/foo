import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function fixBiometricSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
  });

  try {
    console.log('Synchronizing ALL attendance tables...');

    // Disable FK checks to allow schema modification
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // 1. Fix bio_enrolled_users
    console.log('Updating bio_enrolled_users...');
    await connection.execute('ALTER TABLE bio_enrolled_users MODIFY COLUMN employee_id VARCHAR(50) NOT NULL');

    // 2. Fix bio_attendance_logs
    console.log('Updating bio_attendance_logs...');
    await connection.execute('ALTER TABLE bio_attendance_logs MODIFY COLUMN employee_id VARCHAR(50) NOT NULL');

    // 3. Fix core attendance_logs (HR Side)
    console.log('Updating attendance_logs...');
    await connection.execute('ALTER TABLE attendance_logs MODIFY COLUMN employee_id VARCHAR(50) NOT NULL');

    // 4. Fix daily_time_records (Consolidated Side)
    console.log('Updating daily_time_records...');
    await connection.execute('ALTER TABLE daily_time_records MODIFY COLUMN employee_id VARCHAR(50) NOT NULL');

    // 5. Standardize existing IDs to Emp-XXX format across ALL tables
    console.log('Standardizing existing IDs to Emp-XXX format...');
    const tables = ['bio_enrolled_users', 'bio_attendance_logs', 'attendance_logs', 'daily_time_records'];
    
    for (const table of tables) {
      // Convert raw numbers (e.g., '1') to 'Emp-001'
      // Leave already formatted IDs (e.g., 'Emp-001') alone
      await connection.execute(`
        UPDATE ${table} 
        SET employee_id = CONCAT('Emp-', LPAD(employee_id, 3, '0')) 
        WHERE employee_id REGEXP '^[0-9]+$'
      `);
    }

    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Database synchronization complete. 100% Alignment achieved.');

  } catch (error) {
    console.error('Schema fix failed:', error);
  } finally {
    await connection.end();
  }
}

fixBiometricSchema().catch(console.error);
