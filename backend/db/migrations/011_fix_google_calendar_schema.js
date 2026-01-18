import db from '../connection.js';

const runMigration = async () => {
    try {
        console.log('Running migration: Fix google_calendar_tokens schema...');
        
        // Drop existing table to remove bad constraint
        await db.query('DROP TABLE IF EXISTS google_calendar_tokens');
        console.log('Dropped google_calendar_tokens table');

        // Recreate google_calendar_tokens table with correct constraint
        // Assuming authentication table has 'id' as primary key
        await db.query(`
            CREATE TABLE google_calendar_tokens (
                user_id INT PRIMARY KEY,
                access_token TEXT NOT NULL,
                refresh_token TEXT NOT NULL,
                token_expiry DATETIME NOT NULL,
                sync_enabled BOOLEAN DEFAULT TRUE,
                calendar_id VARCHAR(255) DEFAULT 'primary',
                last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES authentication(id) ON DELETE CASCADE
            )
        `);
        console.log('Created google_calendar_tokens table with correct FK');

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

runMigration();
