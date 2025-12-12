import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function runCSCPerformanceMigration() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '', 
            database: process.env.DB_NAME || 'chrmo_db'
        });

        console.log('Connected to database');
        console.log('Running CSC Performance Evaluation Schema Enhancement...\n');

        // Migration steps
        const migrations = [
            {
                name: 'Add self_rating_score to performance_reviews',
                sql: `ALTER TABLE performance_reviews ADD COLUMN self_rating_score DECIMAL(3,2) NULL AFTER total_score`
            },
            {
                name: 'Add supervisor_rating_score to performance_reviews',
                sql: `ALTER TABLE performance_reviews ADD COLUMN supervisor_rating_score DECIMAL(3,2) NULL AFTER self_rating_score`
            },
            {
                name: 'Add final_rating_score to performance_reviews',
                sql: `ALTER TABLE performance_reviews ADD COLUMN final_rating_score DECIMAL(3,2) NULL AFTER supervisor_rating_score`
            },
            {
                name: 'Add self_rating_status to performance_reviews',
                sql: `ALTER TABLE performance_reviews ADD COLUMN self_rating_status ENUM('pending', 'submitted') DEFAULT 'pending' AFTER final_rating_score`
            },
            {
                name: 'Add supervisor_remarks to performance_reviews',
                sql: `ALTER TABLE performance_reviews ADD COLUMN supervisor_remarks TEXT NULL AFTER overall_feedback`
            },
            {
                name: 'Add employee_remarks to performance_reviews',
                sql: `ALTER TABLE performance_reviews ADD COLUMN employee_remarks TEXT NULL AFTER supervisor_remarks`
            },
            {
                name: 'Add head_remarks to performance_reviews',
                sql: `ALTER TABLE performance_reviews ADD COLUMN head_remarks TEXT NULL AFTER employee_remarks`
            },
            {
                name: 'Add disagree_remarks to performance_reviews',
                sql: `ALTER TABLE performance_reviews ADD COLUMN disagree_remarks TEXT NULL AFTER head_remarks`
            },
            {
                name: 'Add approved_by to performance_reviews',
                sql: `ALTER TABLE performance_reviews ADD COLUMN approved_by INT NULL AFTER disagree_remarks`
            },
            {
                name: 'Add approved_at to performance_reviews',
                sql: `ALTER TABLE performance_reviews ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by`
            },
            {
                name: 'Add disagreed flag to performance_reviews',
                sql: `ALTER TABLE performance_reviews ADD COLUMN disagreed BOOLEAN DEFAULT FALSE AFTER approved_at`
            },
            {
                name: 'Add rating_period to performance_reviews',
                sql: `ALTER TABLE performance_reviews ADD COLUMN rating_period ENUM('1st_sem', '2nd_sem', 'annual') DEFAULT 'annual' AFTER disagreed`
            },
            {
                name: 'Add self_score to performance_review_items',
                sql: `ALTER TABLE performance_review_items ADD COLUMN self_score DECIMAL(3,2) NULL AFTER score`
            },
            {
                name: 'Add actual_accomplishments to performance_review_items',
                sql: `ALTER TABLE performance_review_items ADD COLUMN actual_accomplishments TEXT NULL AFTER self_score`
            },
            {
                name: 'Add criteria_type to performance_criteria',
                sql: `ALTER TABLE performance_criteria ADD COLUMN criteria_type ENUM('core_function', 'support_function', 'core_competency', 'organizational_competency') DEFAULT 'core_function' AFTER category`
            },
            {
                name: 'Add is_active to performance_criteria',
                sql: `ALTER TABLE performance_criteria ADD COLUMN is_active BOOLEAN DEFAULT TRUE`
            },
            {
                name: 'Create performance_audit_log table',
                sql: `CREATE TABLE IF NOT EXISTS performance_audit_log (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    review_id INT NOT NULL,
                    action VARCHAR(50) NOT NULL,
                    actor_id INT NOT NULL,
                    details TEXT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (review_id) REFERENCES performance_reviews(id) ON DELETE CASCADE,
                    FOREIGN KEY (actor_id) REFERENCES authentication(id) ON DELETE CASCADE
                )`
            }
        ];

        for (const migration of migrations) {
            try {
                await connection.query(migration.sql);
                console.log(`✅ ${migration.name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`⏭️  ${migration.name} (already exists)`);
                } else {
                    console.log(`❌ ${migration.name}: ${err.message}`);
                }
            }
        }

        console.log('\n✅ CSC Performance Enhancement Migration completed!');

    } catch (error) {
        console.error('Error running migration:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

runCSCPerformanceMigration();
