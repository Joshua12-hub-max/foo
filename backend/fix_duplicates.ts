
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chrmo_db'
  });

  try {
    console.log('--- Fixing Judith Guevarra IDs to avoid conflict ---');
    // Change Judith's IDs so they don't conflict with Juano
    // Corrected column names based on pds.ts: umid_no, gsis_number, philhealth_number, pagibig_number, tin_number, philsys_id
    const [result] = await connection.query(`
      UPDATE pds_personal_information 
      SET 
        umid_no = '9999-0000000-1',
        gsis_number = '99-0000000-1',
        philhealth_number = '99-000000000-1',
        pagibig_number = '9999-0000-0001',
        tin_number = '999-000-001-000',
        philsys_id = '9999-0000-0000-0001'
      WHERE employee_id = 5
    `);
    console.log('Update result:', result);

  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

main();
