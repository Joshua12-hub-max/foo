import db from '../connection.js';

const runMigration = async () => {
    try {
        console.log('Running migration: Create google_calendar_tokens and synced_events tables...');
        
        // Create google_calendar_tokens table
        await db.query(`
            CREATE TABLE IF NOT EXISTS google_calendar_tokens (
                user_id INT PRIMARY KEY,
                access_token TEXT NOT NULL,
                refresh_token TEXT NOT NULL,
                token_expiry DATETIME NOT NULL,
                sync_enabled BOOLEAN DEFAULT TRUE,
                calendar_id VARCHAR(255) DEFAULT 'primary',
                last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Created google_calendar_tokens table');

        // Create synced_events table
        await db.query(`
            CREATE TABLE IF NOT EXISTS synced_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                local_event_id INT NOT NULL,
                google_event_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_event_mapping (local_event_id, google_event_id)
            )
        `);
        console.log('Created synced_events table');

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

runMigration();
