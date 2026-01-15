import db from '../db/connection.js';

async function cleanupRecruitment() {
  try {
    console.log('🧹 Cleaning up recruitment data...');

    // Delete all applicants
    const [applicantsResult] = await db.query('DELETE FROM recruitment_applicants');
    // @ts-ignore
    console.log(`✅ Deleted ${applicantsResult.affectedRows} applicant records.`);

    // Optional: Reset Auto Increment
    await db.query('ALTER TABLE recruitment_applicants AUTO_INCREMENT = 1');
    console.log('✅ Reset applicant ID counter.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupRecruitment();
