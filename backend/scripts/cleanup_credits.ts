import db from '../db/connection.js';

async function cleanupCredits() {
  try {
    console.log('🧹 Cleaning up orphan credits...');

    const [result] = await db.query(`
      DELETE FROM leave_credits 
      WHERE employee_id NOT IN (SELECT employee_id FROM authentication)
    `);

    console.log(`✅ Deleted ${result.affectedRows} orphan credit records.`);
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupCredits();
