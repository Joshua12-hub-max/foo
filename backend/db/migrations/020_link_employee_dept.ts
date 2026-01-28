import db from '../connection.js';

/**
 * Migration: Link Employees (Authentication) to Departments with IDs
 * 
 * 1. Adds department_id to authentication
 * 2. Migrates existing department name strings to IDs
 * 3. Establishes foreign key constraint
 */

const migration = async (): Promise<void> => {
  console.log('🚀 Starting Employee-Department Connectivity Migration...');

  try {
    // 1. Prepare authentication table
    console.log('📝 Modifying authentication table...');
    try {
      await db.query(`
        ALTER TABLE authentication 
        ADD COLUMN department_id INT NULL AFTER department
      `);
      console.log('  ✅ Added department_id to authentication');
    } catch (err: any) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log('  ⚠️  department_id already exists in authentication');
      else throw err;
    }

    // 2. Migrate mapping
    console.log('📊 Migrating Employee department names to IDs...');
    await db.query(`
      UPDATE authentication a
      JOIN departments d ON a.department = d.name
      SET a.department_id = d.id
      WHERE a.department_id IS NULL
    `);
    console.log('  ✅ Migration complete');

    // 3. Add Foreign Key
    console.log('🔗 Adding Foreign Key: authentication(department_id) -> departments(id)...');
    try {
      await db.query(`
        ALTER TABLE authentication
        ADD CONSTRAINT fk_auth_department
        FOREIGN KEY (department_id) 
        REFERENCES departments(id) 
        ON DELETE SET NULL
      `);
      console.log('  ✅ Added fk_auth_department');
    } catch (err: any) {
      if (err.code === 'ER_DUP_KEYNAME') console.log('  ⚠️  fk_auth_department already exists');
      else throw err;
    }

    console.log('\n🎉 Employee-Department Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration
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
