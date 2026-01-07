import db from '../connection.js';

const runMigration = async () => {
    try {
        console.log('Running migration: Add interviewer_id to recruitment_applicants...');
        
        const updates = [
            "ADD COLUMN interviewer_id INT NULL",
            "ADD CONSTRAINT fk_interviewer FOREIGN KEY (interviewer_id) REFERENCES authentication(id) ON DELETE SET NULL"
        ];

        for (const update of updates) {
            try {
                await db.query(`ALTER TABLE recruitment_applicants ${update}`);
                console.log(`Executed: ${update}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME') {
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
