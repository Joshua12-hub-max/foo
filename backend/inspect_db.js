
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chrmo_db'
  });

  try {
    console.log('--- Judith Search ---');
    const [judith] = await connection.query("SELECT id, employee_id, first_name, last_name, role, is_verified, profile_status FROM authentication WHERE last_name LIKE '%Guevarra%'");
    console.log(judith);

    console.log('\n--- Leave Applications (First 5) ---');
    const [leavesApp] = await connection.query('SELECT id, employee_id, leave_type, status, start_date, end_date FROM leave_applications LIMIT 5');
    console.log(leavesApp);

    console.log('\n--- Leave Requests (First 5) ---');
    const [leavesReq] = await connection.query('SELECT id, employee_id, leave_type, status, start_date, end_date FROM leave_requests LIMIT 5');
    console.log(leavesReq);

    console.log('\n--- Count by Employee ---');
    const [counts] = await connection.query('SELECT employee_id, COUNT(*) as count FROM leave_applications GROUP BY employee_id');
    console.log(counts);

    console.log('\n--- Security Logs (First 5) ---');
    const [secLogs] = await connection.query('SELECT id, first_name, last_name, violation_type, details FROM recruitment_security_logs LIMIT 5');
    console.log(secLogs);

    console.log('\n--- Count by Violation Type ---');
    const [violationCounts] = await connection.query('SELECT violation_type, COUNT(*) as count FROM recruitment_security_logs GROUP BY violation_type');
    console.log(violationCounts);

  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

main();
