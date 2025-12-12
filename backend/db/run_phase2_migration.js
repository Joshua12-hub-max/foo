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
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '', 
            database: process.env.DB_NAME || 'chrmo_db',
            multipleStatements: true
        });

        console.log('Connected to database');

        // 1. Add Columns to Departments Table
        console.log('Checking departments table...');
        const deptColumns = [
            { name: 'budget', type: 'DECIMAL(15, 2) DEFAULT 0.00' },
            { name: 'parent_department_id', type: 'INT' },
            { name: 'location', type: 'VARCHAR(255)' }
        ];

        for (const col of deptColumns) {
            const [rows] = await connection.query(
                `SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'departments' AND COLUMN_NAME = ?`,
                [process.env.DB_NAME || 'chrmo_db', col.name]
            );

            if (rows.length === 0) {
                console.log(`Adding column to departments: ${col.name}`);
                await connection.query(`ALTER TABLE departments ADD COLUMN ${col.name} ${col.type}`);
                
                if (col.name === 'parent_department_id') {
                     await connection.query(`ALTER TABLE departments ADD CONSTRAINT fk_parent_dept FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE SET NULL`);
                }
            } else {
                console.log(`Column ${col.name} already exists in departments.`);
            }
        }

        // 2. Add Columns to Performance Reviews Table
        console.log('Checking performance_reviews table...');
        const reviewColumns = [
            { name: 'review_cycle_id', type: 'INT' },
            { name: 'is_self_assessment', type: 'BOOLEAN DEFAULT FALSE' }
        ];

        for (const col of reviewColumns) {
             const [rows] = await connection.query(
                `SELECT * FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'performance_reviews' AND COLUMN_NAME = ?`,
                [process.env.DB_NAME || 'chrmo_db', col.name]
            );

            if (rows.length === 0) {
                console.log(`Adding column to performance_reviews: ${col.name}`);
                await connection.query(`ALTER TABLE performance_reviews ADD COLUMN ${col.name} ${col.type}`);
            } else {
                console.log(`Column ${col.name} already exists in performance_reviews.`);
            }
        }

        // 3. Run SQL for new tables
        const sqlFile = path.join(__dirname, 'phase2_schema.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('Creating Phase 2 tables...');
        // Split by semicolon to handle multiple statements safely if needed, 
        // but multipleStatements: true usually handles it. 
        // However, for better error reporting, we can execute one by one if we parse it, 
        // but for now let's trust the driver.
        await connection.query(sql);
        
        // 4. Add FK for review_cycle_id if it was just added and table exists
        // We do this after creating tables because performance_review_cycles is in the SQL file
        try {
            // Check if constraint exists
            const [constraints] = await connection.query(
                `SELECT * FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'performance_reviews' AND CONSTRAINT_NAME = 'fk_review_cycle'`,
                [process.env.DB_NAME || 'chrmo_db']
            );
            
            if (constraints.length === 0) {
                 console.log('Adding FK constraint for review_cycle_id...');
                 await connection.query(`ALTER TABLE performance_reviews ADD CONSTRAINT fk_review_cycle FOREIGN KEY (review_cycle_id) REFERENCES performance_review_cycles(id) ON DELETE SET NULL`);
            }
        } catch (e) {
            console.log('Note: Could not add fk_review_cycle (might already exist or table missing):', e.message);
        }

        console.log('Phase 2 Migration completed successfully!');

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
