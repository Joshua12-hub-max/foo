import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chrmo_db'
  });

  try {
    console.log('--- recruitment_applicants ---');
    const [cols1] = await connection.query('DESCRIBE recruitment_applicants');
    console.log(JSON.stringify(cols1, null, 2));

    console.log('\n--- recruitment_jobs ---');
    const [cols2] = await connection.query('DESCRIBE recruitment_jobs');
    console.log(JSON.stringify(cols2, null, 2));

    console.log('\n--- recruitment_security_logs ---');
    const [cols3] = await connection.query('DESCRIBE recruitment_security_logs');
    console.log(JSON.stringify(cols3, null, 2));

    console.log('\n--- hired applicants check ---');
    const [hiredCount] = await connection.query("SELECT COUNT(*) as count FROM recruitment_applicants WHERE stage = 'Hired'");
    console.log(hiredCount);

    console.log('\n--- hired applicants details ---');
    const [hiredDetails] = await connection.query("SELECT id, first_name, last_name, stage, is_confirmed, hired_date, job_id FROM recruitment_applicants WHERE stage = 'Hired'");
    console.log(hiredDetails);

    if (hiredDetails.length > 0) {
        const jobIds = hiredDetails.map(h => h.job_id).filter(id => id !== null);
        if (jobIds.length > 0) {
            console.log('\n--- linked jobs details ---');
            const [jobs] = await connection.query(`SELECT id, title, department, employment_type, duty_type FROM recruitment_jobs WHERE id IN (${jobIds.join(',')})`);
            console.log(jobs);
        }
    }

  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

main();
