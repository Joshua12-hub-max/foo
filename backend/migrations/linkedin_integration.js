import db from '../db/connection.js';

/**
 * Migration: Add linkedin_post_id column to recruitment_jobs table
 * Also make resume_path nullable in recruitment_applicants
 */
const runMigration = async () => {
    try {
        console.log('Running LinkedIn integration migration...');

        // Add linkedin_post_id column if it doesn't exist
        try {
            await db.query(`
                ALTER TABLE recruitment_jobs 
                ADD COLUMN linkedin_post_id VARCHAR(255) NULL
            `);
            console.log('✓ Added linkedin_post_id column to recruitment_jobs');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('- linkedin_post_id column already exists');
            } else {
                throw err;
            }
        }

        // Make resume_path nullable (to prevent crash on emails without resume)
        try {
            await db.query(`
                ALTER TABLE recruitment_applicants 
                MODIFY COLUMN resume_path VARCHAR(255) NULL
            `);
            console.log('✓ Made resume_path nullable in recruitment_applicants');
        } catch (err) {
            console.log('- Could not modify resume_path:', err.message);
        }

        // Create system_settings table if it doesn't exist (for storing LinkedIn token)
        try {
            await db.query(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    setting_key VARCHAR(255) PRIMARY KEY,
                    setting_value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            console.log('✓ Created/verified system_settings table');
        } catch (err) {
            console.log('- Could not create system_settings table:', err.message);
        }

        // Clean up junk applicants from notification emails
        try {
            const [result] = await db.query(`
                DELETE FROM recruitment_applicants 
                WHERE email LIKE '%no-reply%' 
                   OR email LIKE '%noreply%' 
                   OR email LIKE '%mailer-daemon%'
                   OR email LIKE '%facebookmail%'
                   OR email LIKE '%discordapp%'
                   OR first_name IN ('Mail', 'Google', 'Facebook', 'Discord', 'Postmaster')
            `);
            if (result.affectedRows > 0) {
                console.log(`✓ Cleaned up ${result.affectedRows} junk applicant records`);
            }
        } catch (err) {
            console.log('- Could not clean junk records:', err.message);
        }

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

runMigration();
