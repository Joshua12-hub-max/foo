import pool from '../db/index.js';

async function runMigration() {
  console.log('Starting targeted migration for recruitment_applicants...');
  
  const addColumnsQueries = [
    `ALTER TABLE recruitment_applicants ADD COLUMN nationality varchar(100);`,
    `ALTER TABLE recruitment_applicants ADD COLUMN telephone_no varchar(50);`,
    `ALTER TABLE recruitment_applicants ADD COLUMN emergency_contact varchar(255);`,
    `ALTER TABLE recruitment_applicants ADD COLUMN emergency_contact_number varchar(50);`,
    `ALTER TABLE recruitment_applicants ADD COLUMN facebook_url varchar(255);`,
    `ALTER TABLE recruitment_applicants ADD COLUMN linkedin_url varchar(255);`,
    `ALTER TABLE recruitment_applicants ADD COLUMN twitter_handle varchar(255);`
  ];

  try {
    for (const query of addColumnsQueries) {
        console.log(`Executing: ${query}`);
        try {
            await pool.query(query);
            console.log('Success.');
        } catch (err: any) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists, skipping.');
            } else {
                throw err;
            }
        }
    }
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

runMigration();
