import db from './backend/db/connection.js';

async function checkCredits() {
  try {
    const [allCredits] = await db.query("SELECT * FROM leave_credits LIMIT 1");
    if (allCredits.length > 0) {
        console.log('Sample Credit:', allCredits[0]);
    } else {
        console.log('No credits found in the entire table.');
    }
    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkCredits();
