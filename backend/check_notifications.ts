
import db from './db/connection.js';

async function checkNotifications() {
  try {
    const [rows] = await db.query('DESCRIBE notifications');
    console.log('Columns:');
    (rows as any[]).forEach(row => {
        console.log(`${row.Field} (${row.Type}) Nullable: ${row.Null}`);
    });
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

checkNotifications();
