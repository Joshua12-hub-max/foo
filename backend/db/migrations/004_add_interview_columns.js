import db from '../connection.js';

const runMigration = async () => {
    try {
        console.log('Running migration: Add interview columns to recruitment_applicants...');
        
        const updates = [
            "ADD COLUMN stage ENUM('Applied', 'Screening', 'Initial Interview', 'Final Interview', 'Offer', 'Hired', 'Rejected') DEFAULT 'Applied'",
            "ADD COLUMN interview_date DATETIME NULL",
            "ADD COLUMN interview_link VARCHAR(500) NULL",
            "ADD COLUMN interview_platform ENUM('Google Meet', 'Zoom', 'Other') DEFAULT 'Google Meet'",
            "ADD COLUMN interview_notes TEXT NULL"
        ];

        for (const update of updates) {
            try {
                await db.query(`ALTER TABLE recruitment_applicants ${update}`);
                console.log(`Executed: ${update}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Skipped (already exists): ${update}`);
                } else {
                    console.error(`Failed: ${update}`, err);
                }
            }
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

runMigration();
