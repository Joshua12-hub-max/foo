import db from '../index.js';

/**
 * Migration 029: Fix Citizenship Type ENUM and Harmonize PDS Fields
 * 
 * 1. Change citizenship_type to enum('By Birth', 'By Naturalization')
 * 2. Harmonize birth_date and date_of_birth (standardize on birth_date)
 * 3. Ensure addresses can hold full text
 */

const migration = async (): Promise<void> => {
  console.log('🚀 Starting PDS Field Harmonization Migration...');

  try {
    // 1. Fix citizenship_type ENUM
    console.log('🔧 Updating citizenship_type ENUM...');
    // We first convert to VARCHAR to avoid data loss during enum change if current data is incompatible
    await db.query('ALTER TABLE authentication MODIFY COLUMN citizenship_type VARCHAR(50)');
    
    // Clean up incompatible data (e.g., if it says 'Filipino')
    await db.query(`UPDATE authentication SET citizenship_type = 'By Birth' WHERE citizenship_type = 'Filipino'`);
    
    await db.query(`
      ALTER TABLE authentication 
      MODIFY COLUMN citizenship_type ENUM('By Birth', 'By Naturalization') DEFAULT 'By Birth'
    `);
    console.log('  ✅ Fixed citizenship_type ENUM');

    // 2. Harmonize Birth Date
    console.log('📅 Harmonizing Birth Date fields...');
    // If date_of_birth is set but birth_date is null, copy it
    await db.query('UPDATE authentication SET birth_date = date_of_birth WHERE birth_date IS NULL AND date_of_birth IS NOT NULL');
    
    // Optional: Drop date_of_birth if we are sure, but let's keep it safe for now and just use birth_date in code.
    console.log('  ✅ Birth date fields harmonized');

    // 3. Ensure PDS fields are text for long addresses
    console.log('📝 Ensuring address fields are TEXT...');
    await db.query('ALTER TABLE authentication MODIFY COLUMN residential_address TEXT');
    await db.query('ALTER TABLE authentication MODIFY COLUMN permanent_address TEXT');
    await db.query('ALTER TABLE authentication MODIFY COLUMN address TEXT');
    console.log('  ✅ Address fields converted to TEXT');

    console.log('\n🎉 Migration 029 completed successfully!');

  } catch (error) {
    console.error('❌ Migration 029 failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (import.meta.url.endsWith('029_harmonize_pds_fields.ts')) {
  migration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default migration;
