import db from '../connection.js';

/**
 * Migration: Link Plantilla, Departments, and Employees with Foreign Keys
 * 
 * 1. Adds department_id to plantilla_positions
 * 2. Adds position_id to authentication (employee record)
 * 3. Migrates existing name-based mapping to ID-based mapping
 * 4. Establishes strict foreign key constraints
 */

const migration = async (): Promise<void> => {
  console.log('Starting Data Connectivity Migration...');

  try {
    // 1. Prepare plantilla_positions table
    console.log(' Modifying plantilla_positions table...');
    try {
      await db.query(`
        ALTER TABLE plantilla_positions 
        ADD COLUMN department_id INT NULL AFTER department
      `);
      console.log(' Added department_id to plantilla_positions');
    } catch (err: any) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log(' department_id already exists in plantilla_positions');
      else throw err;
    }

    // 2. Prepare authentication table
    console.log(' Modifying authentication table...');
    try {
      await db.query(`
        ALTER TABLE authentication 
        ADD COLUMN position_id INT NULL AFTER item_number
      `);
      console.log(' Added position_id to authentication');
    } catch (err: any) {
      if (err.code === 'ER_DUP_FIELDNAME') console.log(' position_id already exists in authentication');
      else throw err;
    }

    // 3. Migrate Plantilla -> Department mapping
    console.log(' Migrating Plantilla to Department relationships...');
    await db.query(`
      UPDATE plantilla_positions p
      JOIN departments d ON p.department = d.name
      SET p.department_id = d.id
      WHERE p.department_id IS NULL
    `);
    console.log(' Migrated Plantilla department names to IDs');

    // 4. Migrate Authentication -> Plantilla mapping (by item number)
    console.log(' Migrating Employee to Plantilla relationships...');
    await db.query(`
      UPDATE authentication a
      JOIN plantilla_positions p ON a.item_number = p.item_number
      SET a.position_id = p.id
      WHERE a.position_id IS NULL AND a.item_number IS NOT NULL AND a.item_number != 'N/A'
    `);
    console.log(' Migrated Employee item numbers to position IDs');

    // 5. Add Constraints for Plantilla -> Department
    console.log(' Adding Foreign Key: plantilla_positions(department_id) -> departments(id)...');
    try {
      await db.query(`
        ALTER TABLE plantilla_positions
        ADD CONSTRAINT fk_plantilla_department
        FOREIGN KEY (department_id) 
        REFERENCES departments(id) 
        ON DELETE SET NULL
      `);
      console.log(' Added fk_plantilla_department');
    } catch (err: any) {
      if (err.code === 'ER_DUP_KEYNAME') console.log('  ⚠️  fk_plantilla_department already exists');
      else throw err;
    }

    // 6. Add Constraints for Authentication -> Plantilla
    console.log(' Adding Foreign Key: authentication(position_id) -> plantilla_positions(id)...');
    try {
      await db.query(`
        ALTER TABLE authentication
        ADD CONSTRAINT fk_auth_plantilla
        FOREIGN KEY (position_id) 
        REFERENCES plantilla_positions(id) 
        ON DELETE SET NULL
      `);
      console.log('  Added fk_auth_plantilla');
    } catch (err: any) {
      if (err.code === 'ER_DUP_KEYNAME') console.log('  ⚠️  fk_auth_plantilla already exists');
      else throw err;
    }

    // 7. Cleanup (Optional: keep name columns for display fallback, but we should rely on IDs now)
    console.log(' Mapping complete. IDs are now the source of truth.');

    console.log('\n Connectivity Migration completed successfully!');

  } catch (error) {
    console.error(' Migration failed:', error);
    throw error;
  }
};

// Run migration
migration()
  .then(() => {
    console.log('\n Migration script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n Migration script failed:', error);
    process.exit(1);
  });

export default migration;
