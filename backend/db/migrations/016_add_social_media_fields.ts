import db from '../connection.js';

/**
 * Migration: Add Social Media Fields to Employee Profile
 * 
 * Adds the following columns to authentication table:
 * - facebook_url: Facebook profile URL
 * - linkedin_url: LinkedIn profile URL
 * - twitter_handle: Twitter/X handle
 */

const migration = async (): Promise<void> => {
  console.log('🚀 Starting Social Media Fields Migration...');

  try {
    const socialMediaFields = [
      {
        name: 'facebook_url',
        definition: 'VARCHAR(255) NULL COMMENT "Facebook profile URL"'
      },
      {
        name: 'linkedin_url',
        definition: 'VARCHAR(255) NULL COMMENT "LinkedIn profile URL"'
      },
      {
        name: 'twitter_handle',
        definition: 'VARCHAR(100) NULL COMMENT "Twitter/X handle (without @)"'
      }
    ];

    for (const field of socialMediaFields) {
      try {
        await db.query(`
          ALTER TABLE authentication 
          ADD COLUMN ${field.name} ${field.definition}
        `);
        console.log(`  ✅ Added ${field.name} to authentication`);
      } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`  ⚠️  ${field.name} already exists in authentication`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n🎉 Social Media Fields Migration completed successfully!');

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
