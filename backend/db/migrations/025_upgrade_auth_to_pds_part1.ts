import db from '../index.js';

/**
 * Migration: Upgrade Authentication Table to PDS Part I
 * 
 * Adds CS Form 212 Part I (Personal Information) fields directly to the authentication table.
 * This ensures the Employee Profile and PDS share the same source of truth.
 */

const migration = async (): Promise<void> => {
  console.log('🚀 Starting Authentication -> PDS Upgrade...');

  try {
    const pdsFields = [
      // Personal Details
      { name: 'place_of_birth', definition: 'VARCHAR(255) NULL' },
      { name: 'date_of_birth', definition: 'DATE NULL' }, // Might exist, check duplication
      { name: 'civil_status', definition: 'ENUM("Single", "Married", "Widowed", "Separated", "Other") NULL' },
      { name: 'height_m', definition: 'DECIMAL(4,2) NULL COMMENT "Height in meters"' },
      { name: 'weight_kg', definition: 'DECIMAL(5,2) NULL COMMENT "Weight in kg"' },
      { name: 'blood_type', definition: 'VARCHAR(5) NULL' },
      
      // IDs
      { name: 'gsis_id_no', definition: 'VARCHAR(50) NULL' },
      { name: 'pagibig_id_no', definition: 'VARCHAR(50) NULL' },
      { name: 'philhealth_no', definition: 'VARCHAR(50) NULL' }, // Might exist
      { name: 'philsys_id', definition: 'VARCHAR(50) NULL' },
      { name: 'tin_no', definition: 'VARCHAR(50) NULL' }, // Might exist
      { name: 'agency_employee_no', definition: 'VARCHAR(50) NULL' },
      
      // Citizenship
      { name: 'citizenship', definition: 'VARCHAR(50) DEFAULT "Filipino"' },
      { name: 'citizenship_type', definition: 'ENUM("Filipino", "Dual Citizenship") DEFAULT "Filipino"' },
      { name: 'dual_citizenship_country', definition: 'VARCHAR(100) NULL' },
      
      // Addresses
      { name: 'residential_address', definition: 'TEXT NULL' },
      { name: 'residential_zip_code', definition: 'VARCHAR(10) NULL' },
      { name: 'permanent_address', definition: 'TEXT NULL' },
      { name: 'permanent_zip_code', definition: 'VARCHAR(10) NULL' },
      { name: 'telephone_no', definition: 'VARCHAR(50) NULL' },
      { name: 'mobile_no', definition: 'VARCHAR(50) NULL' } // might exist
    ];

    for (const field of pdsFields) {
      try {
        await db.query(`
          ALTER TABLE authentication 
          ADD COLUMN ${field.name} ${field.definition}
        `);
        console.log(`  ✅ Added ${field.name}`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ⚠️  ${field.name} already exists`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n🎉 Authentication Upgrade completed!');

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
