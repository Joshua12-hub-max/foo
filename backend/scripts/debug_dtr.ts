
import db from '../db/connection.js';

const checkLinkage = async () => {
  try {
    console.log('--- Checking Fingerprints Table ---');
    const [fingerprints] = await db.query('SELECT * FROM fingerprints');
    console.table(fingerprints);

    console.log('\n--- Checking Authentication Table ---');
    const [users] = await db.query('SELECT employee_id, email, first_name FROM authentication');
    console.table(users);

    console.log('\n--- Checking Attendance Logs (Latest 5) ---');
    const [logs] = await db.query('SELECT * FROM attendance_logs ORDER BY scan_time DESC LIMIT 5');
    console.table(logs);

    console.log('\n--- Checking Daily Time Records (Latest 5) ---');
    const [dtrs] = await db.query('SELECT * FROM daily_time_records ORDER BY date DESC LIMIT 5');
    console.table(dtrs);

  } catch (error) {
    console.error(error);
  }
  process.exit();
};

checkLinkage();
