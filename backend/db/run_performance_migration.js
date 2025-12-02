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
            host: 'localhost',
            user: 'root',
            password: '', // Add your MySQL password here if needed
            database: 'chrmo_db',
            multipleStatements: true
        });

        console.log('Connected to database');

        // Read the SQL file
        const sqlFile = path.join(__dirname, 'add_performance_schema.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        console.log('Running migration...');
        // console.log(sql); 

        // Execute the SQL
        await connection.query(sql);

        console.log('Migration completed successfully!');
        console.log('Added performance tables and updated authentication table.');

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
