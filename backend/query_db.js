
import mysql from 'mysql2/promise';

const query = process.argv[2];

if (!query) {
  console.error('Please provide a query.');
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chrmo_db'
  });

  try {
    const [rows] = await connection.query(query);
    console.log(JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await connection.end();
  }
}

main();
