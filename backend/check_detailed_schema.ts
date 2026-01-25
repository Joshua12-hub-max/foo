
import db from './db/connection.js';

async function checkSchema() {
  try {
    const [rows] = await db.query('DESCRIBE announcements');
    console.log('Detailed Schema:');
    (rows as any[]).forEach(row => {
        console.log(`Field: ${row.Field}, Type: ${row.Type}, Null: ${row.Null}, Default: ${row.Default}`);
    });
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

checkSchema();
