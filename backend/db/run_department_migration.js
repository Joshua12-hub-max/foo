import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

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

        const sqlFile = path.join(__dirname, 'add_departments_table.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('Creating departments table...');
        await connection.query(sql);

        console.log('Migration completed successfully!');

    } catch (error) {
        console.error('Error running migration:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMigration();
