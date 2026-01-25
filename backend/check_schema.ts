
import db from './db/connection.js';

async function checkSchema() {
  try {
    const [rows] = await db.query('DESCRIBE announcements');
    console.log('Columns:');
    (rows as any[]).forEach(row => {
        console.log(`${row.Field} (${row.Type})`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error describing table:', error);
    process.exit(1);
  }
}

checkSchema();
