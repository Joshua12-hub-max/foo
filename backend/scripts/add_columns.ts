import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addMissingColumns() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: Number(process.env.DB_PORT) || 3306,
            database: process.env.DB_NAME || 'chrmo_db',
        });

        const columns = [
            ["facebook_url", "VARCHAR(255) DEFAULT NULL"],
            ["linkedin_url", "VARCHAR(255) DEFAULT NULL"],
            ["twitter_handle", "VARCHAR(100) DEFAULT NULL"],
            ["duty_type", "ENUM('Standard','Irregular') DEFAULT 'Standard'"],
            ["daily_target_hours", "DECIMAL(4,2) DEFAULT 8.00"],
            ["salary_basis", "ENUM('Daily','Hourly') DEFAULT 'Daily'"],
        ];

        for (const [name, def] of columns) {
            try {
                await connection.query(`ALTER TABLE authentication ADD COLUMN ${name} ${def}`);
                console.log(`ADDED: ${name}`);
            } catch (err: any) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`EXISTS: ${name}`);
                } else {
                    console.error(`FAIL: ${name} - ${err.message}`);
                }
            }
        }

        console.log('\nDone. All 6 columns should now exist.');
        await connection.end();
    } catch (err: any) {
        console.error('Error:', err.message);
    }
}

addMissingColumns();
