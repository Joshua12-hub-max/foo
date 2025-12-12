import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    let connection;
    
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '', 
            database: process.env.DB_NAME || 'chrmo_db',
            multipleStatements: true
        });

        console.log('Connected to database');

        // 1. Add Columns to Authentication Table
        const columnsToAdd = [
            { name: 'job_title', type: 'VARCHAR(100)' },
            { name: 'employment_status', type: "ENUM('Active', 'Probationary', 'Terminated', 'Resigned', 'On Leave') DEFAULT 'Active'" },
            { name: 'date_hired', type: 'DATE' },
            { name: 'manager_id', type: 'INT' }
        ];

        for (const col of columnsToAdd) {
            const [rows] = await connection.query(
                `SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'authentication' AND COLUMN_NAME = ?`,
                ['chrmo_db', col.name]
            );

            if (rows.length === 0) {
                console.log(`Adding column: ${col.name}`);
                await connection.query(`ALTER TABLE authentication ADD COLUMN ${col.name} ${col.type}`);
                
                // Add FK for manager_id specifically
                if (col.name === 'manager_id') {
                     await connection.query(`ALTER TABLE authentication ADD CONSTRAINT fk_manager FOREIGN KEY (manager_id) REFERENCES authentication(id) ON DELETE SET NULL`);
                }
            } else {
                console.log(`Column ${col.name} already exists.`);
            }
        }

        // 2. Run SQL for new tables
        const sqlFile = path.join(__dirname, 'add_performance_schema.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('Creating performance tables...');
        await connection.query(sql);

        console.log('Migration completed successfully!');

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