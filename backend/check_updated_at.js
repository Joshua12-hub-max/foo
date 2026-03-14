
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chrmo_db'
  });

  try {
    const [cols] = await connection.query('DESCRIBE recruitment_applicants');
    const fields = cols.map(c => c.Field);
    console.log('Fields in recruitment_applicants:');
    console.log(fields);
    
    const hasUpdatedAt = fields.includes('updated_at');
    console.log('Has updated_at:', hasUpdatedAt);

  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

main();
