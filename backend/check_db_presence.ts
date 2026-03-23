import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  console.log('--- Comprehensive Database Audit ---');
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
  };

  try {
    const connection = await mysql.createConnection(config);
    console.log('Connected to:', config.database);

    const tablesToCheck = [
      'authentication',
      'departments',
      'announcements',
      'attendance_logs',
      'leave_applications',
      'recruitment_applicants',
      'performance_reviews',
      'internal_policies',
      'events',
      'holidays',
      'bio_enrolled_users'
    ];

    console.log('Checking row counts for key tables...');
    for (const table of tablesToCheck) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = (rows as Record<string, unknown>[])[0].count;
        console.log(`${table.padEnd(25)}: ${count} rows`);
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'ER_NO_SUCH_TABLE') {
          console.warn(`${table.padEnd(25)}: TABLE MISSING`);
        } else {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`${table.padEnd(25)}: Error - ${message}`);
        }
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

checkDatabase();
