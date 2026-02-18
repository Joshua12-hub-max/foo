import db from '../index.js';

const migration = async (): Promise<void> => {
  console.log('🚀 Starting Update Applicant Details Migration...');
  try {
    const columns = [
      'ADD COLUMN address TEXT NULL',
      'ADD COLUMN education TEXT NULL',
      'ADD COLUMN experience TEXT NULL',
      'ADD COLUMN skills TEXT NULL'
    ];

    for (const col of columns) {
      try {
        await db.query(`ALTER TABLE recruitment_applicants ${col}`);
        console.log(`✅ Executed: ${col}`);
      } catch (err: any) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log(`ℹ️ Column already exists: ${col}`);
        } else {
          console.error(`❌ Failed to execute ${col}:`, err);
          throw err;
        }
      }
    }
    console.log('✅ Migration to add applicant details completed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migration()
  .then(() => {
    console.log('\n✅ Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });

export default migration;
