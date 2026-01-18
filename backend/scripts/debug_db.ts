
import db from '../db/connection.js';
import { RowDataPacket } from 'mysql2/promise';

const run = async () => {
  console.log('Starting DB Debug...');

  try {
    console.log('Testing connection...');
    await db.query('SELECT 1');
    console.log('Connection OK.');
  } catch (e) {
    console.error('Connection Failed:', e);
    process.exit(1);
  }

  // Test query 1: authentication + schedules
  try {
    console.log('Testing Authentication + Schedules...');
    const dayName = 'Monday';
    await db.query(`
      SELECT a.employee_id, a.first_name, a.last_name, a.department, a.job_title, a.date_hired, a.employment_status,
             s.is_rest_day, s.start_time, s.end_time
      FROM authentication a
      LEFT JOIN schedules s ON a.employee_id = s.employee_id AND s.day_of_week = ?
      WHERE a.role != 'admin'
      ORDER BY a.date_hired DESC
    `, [dayName]);
    console.log('Query 1 OK.');
  } catch (e) {
    console.error('Query 1 Failed:', e);
  }

  // Test query 2: recruitment_applicants (Hired)
  try {
    console.log('Testing Recruitment Applicants...');
    await db.query(`
      SELECT ra.id, ra.first_name, ra.last_name, ra.email, ra.created_at, ra.hired_date,
             rj.title as job_title, rj.department as department_name
      FROM recruitment_applicants ra
      LEFT JOIN recruitment_jobs rj ON ra.job_id = rj.id
      WHERE ra.stage = 'Hired'
      ORDER BY ra.hired_date DESC, ra.created_at DESC
    `);
    console.log('Query 2 OK (Recruitment).');
  } catch (e) {
    console.error('Query 2 Failed (Recruitment):', e);
  }

  // Test query 3: daily_time_records
  try {
    console.log('Testing DTR...');
    const todayStr = new Date().toISOString().split('T')[0];
    await db.query(`
      SELECT dtr.*, a.first_name, a.last_name, a.department
      FROM daily_time_records dtr
      JOIN authentication a ON dtr.employee_id = a.employee_id
      WHERE DATE(dtr.date) = ?
    `, [todayStr]);
    console.log('Query 3 OK (DTR).');
  } catch (e) {
    console.error('Query 3 Failed (DTR):', e);
  }
  
    // Test query 4: notifications
    try {
        console.log('Testing Notifications...');
        await db.query('SELECT * FROM notifications LIMIT 1');
        console.log('Query 4 OK (Notifications).');
    } catch (e) {
        console.error('Query 4 Failed (Notifications):', e);
    }

  process.exit(0);
};

run();
