import { db } from '../index.js';
import { sql } from 'drizzle-orm';

/**
 * Migration: 100% CSC POP Compliance Upgrade
 * 
 * Adds missing fields to match the official CSC Plantilla of Personnel form.
 */

const migration = async (): Promise<void> => {
  console.log('Starting CSC POP Compliance Migration...');

  try {
    // 1. Update Auth Table (Employee Details)
    const authFields = [
      { name: 'original_appointment_date', definition: 'DATE NULL' },
      { name: 'last_promotion_date', definition: 'DATE NULL' },
      { name: 'middle_name', definition: 'VARCHAR(100) NULL' } // Ensure middle name exists
    ];

    for (const field of authFields) {
      try {
        await db.execute(sql.raw(`ALTER TABLE authentication ADD COLUMN ${field.name} ${field.definition}`));
        console.log(`Added ${field.name} to authentication`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') console.log(`  ⚠️  ${field.name} already exists`);
        else throw error;
      }
    }

    // 2. Update Plantilla Positions (Report caching)
    const positionFields = [
      { name: 'area_code', definition: 'VARCHAR(50) NULL' },
      { name: 'area_type', definition: 'VARCHAR(10) NULL' },
      { name: 'area_level', definition: 'VARCHAR(10) NULL' },
      { name: 'last_promotion_date', definition: 'DATE NULL' }
    ];

    for (const field of positionFields) {
      try {
        await db.execute(sql.raw(`ALTER TABLE plantilla_positions ADD COLUMN ${field.name} ${field.definition}`));
        console.log(`  Added ${field.name} to plantilla_positions`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') console.log(`  ${field.name} already exists`);
        else throw error;
      }
    }


    console.log('\n CSC POP Compliance Migration completed!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

migration()
  .then(() => { console.log('\n Migration script finished'); process.exit(0); })
  .catch((error) => { console.error('\n Migration script failed:', error); process.exit(1); });

export default migration;
