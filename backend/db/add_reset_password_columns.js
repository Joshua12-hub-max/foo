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
            database: process.env.DB_NAME || 'chrmo_db',
            multipleStatements: true
        });

        console.log('Connected to database');

        const sql = `
            ALTER TABLE authentication
            ADD COLUMN reset_password_token VARCHAR(255) NULL AFTER verification_token,
            ADD COLUMN reset_password_expires DATETIME NULL AFTER reset_password_token;
        `;

        console.log('Running migration...');
        await connection.query(sql);

        console.log('Migration completed successfully!');
        console.log('Added columns: reset_password_token, reset_password_expires');

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist. Skipping migration.');
        } else {
            console.error('Error running migration:', error);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

runMigration();
