import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        const sql = fs.readFileSync(path.join(__dirname, 'google_auth_migration.sql'), 'utf8');
        await connection.query(sql);
        console.log('Google Auth columns added successfully.');

    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(' Columns already exist. Skipping...');
        } else {
            console.error('Error:', error);
        }
    } finally {
        if (connection) await connection.end();
    }
}

runMigration();