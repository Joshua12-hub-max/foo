import pool from '../db/index.js';

async function testQuery() {
  try {
    const [rows] = await pool.query(`
      SELECT ra.id, ra.first_name, ra.last_name, ra.is_confirmed, ra.stage, rj.duty_type, rj.employment_type
      FROM recruitment_applicants ra
      INNER JOIN recruitment_jobs rj ON ra.job_id = rj.id
      WHERE ra.is_confirmed = 1 AND ra.stage = 'Rejected'
    `);
    console.log('--- Confirmed Applicants ---');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

testQuery();
