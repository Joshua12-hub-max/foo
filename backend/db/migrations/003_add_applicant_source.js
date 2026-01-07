import db from '../connection.js';

const runMigration = async () => {
    try {
        console.log('Running migration: Create recruitment_applicants table...');
        
        // Create table
        await db.query(`
            CREATE TABLE IF NOT EXISTS recruitment_applicants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                job_id INT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                phone_number VARCHAR(20) NULL,
                resume_path VARCHAR(255) NOT NULL,
                status ENUM('Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected') DEFAULT 'Applied',
                source ENUM('web', 'email') DEFAULT 'web',
                email_subject VARCHAR(255) NULL,
                email_received_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (job_id) REFERENCES recruitment_jobs(id) ON DELETE SET NULL
            )
        `);
        console.log('Created recruitment_applicants table');

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

runMigration();
