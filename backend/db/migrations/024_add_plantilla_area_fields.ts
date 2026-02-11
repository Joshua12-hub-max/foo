import db from '../connection.js';

/**
 * Migration: Add Area Fields to Plantilla
 * 
 * Adds the following columns to plantilla_positions to support CSC Form 5:
 * - area_code: Specific code for the organizational unit
 * - area_type: Region, Province, District, Municipality, etc.
 * - area_level: Key, Technical, Support, Administrative
 */

const migration = async (): Promise<void> => {
  console.log('🚀 Starting Plantilla Area Fields Migration...');

  try {
    const areaFields = [
      {
        name: 'area_code',
        definition: 'VARCHAR(50) NULL COMMENT "Code for the organizational unit (e.g., region code)"'
      },
      {
        name: 'area_type',
        definition: 'ENUM("R", "P", "D", "M", "F", "B") NULL COMMENT "R=Region, P=Province, D=District, M=Municipality, F=Foreign Post, B=Bureau"'
      },
      {
        name: 'area_level',
        definition: 'ENUM("K", "T", "S", "A") NULL COMMENT "K=Key, T=Technical, S=Support, A=Administrative"'
      }
    ];

    for (const field of areaFields) {
      try {
        await db.query(`
          ALTER TABLE plantilla_positions 
          ADD COLUMN ${field.name} ${field.definition}
        `);
        console.log(`  ✅ Added ${field.name} to plantilla_positions`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ⚠️  ${field.name} already exists in plantilla_positions`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n🎉 Plantilla Area Fields Migration completed successfully!');

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
