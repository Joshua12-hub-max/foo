
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chrmo_db'
  });

  try {
    console.log('Adding updated_at column to recruitment_applicants...');
    await connection.query('ALTER TABLE recruitment_applicants ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    console.log('Successfully added updated_at column.');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column updated_at already exists.');
    } else {
      console.error('Error adding column:', error);
    }
  } finally {
    await connection.end();
  }
}

main();
