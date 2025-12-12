import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '', 
            database: process.env.DB_NAME || 'chrmo_db'
        });

        console.log('Connected to database');
        console.log('Adding attachment_path column to undertime_requests table...');

        try {
            await connection.query(`
                ALTER TABLE undertime_requests 
                ADD COLUMN attachment_path VARCHAR(255) NULL AFTER reason
            `);
            console.log('Column added successfully!');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column already exists. Skipping...');
            } else {
                throw err;
            }
        }

        console.log('Migration completed!');

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

runMigration();
