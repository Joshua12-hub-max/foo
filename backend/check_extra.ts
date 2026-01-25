
import db from './db/connection.js';

async function checkSchema() {
  try {
    const [rows] = await db.query('DESCRIBE announcements');
    console.log('Extra info:');
    (rows as any[]).forEach(row => {
        console.log(`Field: ${row.Field}, Extra: ${row.Extra}`);
    });
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

checkSchema();
