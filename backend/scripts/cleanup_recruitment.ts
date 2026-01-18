import { ResultSetHeader } from 'mysql2';
import db from '../db/connection.js';

async function cleanupRecruitment() {
  try {
    console.log('Cleaning up recruitment data...');

    const [applicantsResult] = await db.query<ResultSetHeader>('DELETE FROM recruitment_applicants');
    
    console.log(`Deleted ${applicantsResult.affectedRows} applicant records.`);
    
    await db.query('ALTER TABLE recruitment_applicants AUTO_INCREMENT = 1');

    console.log('Reset applicant ID counter.');

    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupRecruitment();
