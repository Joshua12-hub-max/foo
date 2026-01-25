
import db from '../db/connection.js';

const dropForeignKey = async () => {
  try {
    console.log('Dropping foreign key constraint on fingerprints table...');
    await db.query('ALTER TABLE fingerprints DROP FOREIGN KEY fingerprints_ibfk_1;');
    console.log('✅ Foreign key constraint dropped successfully.');
  } catch (error: any) {
    if (error.errno === 1091) {
      console.log('⚠️ Constraint does not exist (already dropped).');
    } else {
      console.error('❌ Failed to drop constraint:', error);
    }
  }
  process.exit();
};

dropForeignKey();
