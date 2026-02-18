import db from '../index.js';

const migration = async (): Promise<void> => {
  console.log('🚀 Starting Make Resume Optional Migration...');
  try {
    // Modify resume_path to be NULL
    await db.query(`ALTER TABLE recruitment_applicants MODIFY COLUMN resume_path VARCHAR(255) NULL`);
    console.log('✅ Modified resume_path to be NULLABLE');

    console.log('✅ Migration completed');
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
