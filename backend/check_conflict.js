
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chrmo_db'
  });

  try {
    console.log('--- Searching for User ID 5 ---');
    const [user5] = await connection.query("SELECT id, employee_id, email, first_name, last_name FROM authentication WHERE id = 5");
    console.log('User ID 5:', user5);

    const [allUsers] = await connection.query("SELECT id, employee_id, email, first_name, last_name FROM authentication LIMIT 20");
    console.log('All Users (first 20):', allUsers);

    const [pds5] = await connection.query("SELECT id, employee_id, umid_no, first_name, last_name FROM pds_personal_information WHERE employee_id = 5");
    console.log('PDS ID 5:', pds5);

  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

main();
