import db from './backend/db/connection.js';

async function checkCredits() {
  try {
    const employeeId = 'EMP-00873321';
    console.log(`Checking credits for ${employeeId}...`);

    const [credits] = await db.query("SELECT * FROM leave_credits WHERE employee_id = ?", [employeeId]);
    console.log('Credits found:', credits);

    const [allCredits] = await db.query("SELECT * FROM leave_credits LIMIT 5");
    console.log('Sample of all credits:', allCredits);
    
    const [user] = await db.query("SELECT * FROM authentication WHERE employee_id = ?", [employeeId]);
    console.log('User found:', user);

    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkCredits();
