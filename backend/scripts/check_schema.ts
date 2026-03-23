import pool from '../db/index.js';

async function checkSchema() {
  try {
    const [authCols] = await pool.query('DESCRIBE authentication');
    console.log('--- Authentication Columns ---');
    (authCols as never[]).forEach(col => console.log(col.Field));

    const [applicantCols] = await pool.query('DESCRIBE recruitment_applicants');
    console.log('\n--- Recruitment Applicants Columns ---');
    (applicantCols as never[]).forEach(col => console.log(col.Field));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkSchema();
