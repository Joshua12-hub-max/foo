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
        console.log('Running SPMS schema migration...');

        // Read the SQL file
        const sqlPath = path.join(__dirname, 'spms_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute the SQL
        await connection.query(sql);

        console.log(' SPMS tables created successfully!');
        console.log('   - spms_cycles');
        console.log('   - spms_mfo');
        console.log('   - spms_kra');
        console.log('   - spms_success_indicators');
        console.log('   - spms_competencies (with default data)');
        console.log('   - spms_ipcr');
        console.log('   - spms_ipcr_items');
        console.log('   - spms_ipcr_competencies');
        console.log('   - spms_ipcr_logs');

    } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('Tables already exist. Skipping...');
        } else if (error.code === 'ER_DUP_ENTRY') {
            console.log('Default competencies already inserted. Skipping...');
        } else {
            console.error('Error running migration:', error);
            process.exit(1);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

runMigration();
