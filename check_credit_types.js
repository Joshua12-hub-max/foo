import db from './backend/db/connection.js';

async function checkTypes() {
  try {
    const [types] = await db.query("SELECT DISTINCT credit_type FROM leave_credits");
    console.log('Credit Types:', types);
    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkTypes();
