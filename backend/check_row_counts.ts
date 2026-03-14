import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkRowCounts() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
  };

  try {
    const connection = await mysql.createConnection(config);
    const tables = [
      'authentication', 'departments', 'announcements', 'attendance_logs', 
      'leave_applications', 'recruitment_applicants', 'performance_reviews', 
      'internal_policies', 'events', 'holidays', 'bio_enrolled_users'
    ];

    console.log('--- TABLE ROW COUNTS ---');
    for (const table of tables) {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`${table.padEnd(30)}: ${(rows as any[])[0].count}`);
    }
    await connection.end();
  } catch (error) {
    console.error('Failed to check row counts:', error);
  }
}

checkRowCounts();
