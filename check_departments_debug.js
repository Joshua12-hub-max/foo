import db from './backend/db/connection.js';

async function checkDepartments() {
  try {
    console.log('--- Checking Departments Table ---');
    const [departments] = await db.query("SELECT * FROM departments");
    console.log('Departments found:', departments.length);
    if (departments.length > 0) {
        console.log('Sample:', departments[0]);
    } else {
        console.log('❌ Departments table is empty!');
    }
    
    process.exit();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkDepartments();
