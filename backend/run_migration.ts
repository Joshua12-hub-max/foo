import fs from 'fs';
import mysql from 'mysql2/promise';

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      database: 'chrmo_db',
      multipleStatements: true
    });
    
    console.log('Connected to DB');
    const sqlScript = fs.readFileSync('C:\\Users\\Joshua\\project\\nebr\\migrate_bio.sql', 'utf8');
    
    // Split by semicolons for safer execution, or run as a block since multipleStatements is true
    await connection.query(sqlScript);
    console.log('Migration completed successfully!');
    
    // Check type
    const [rows] = await connection.query("SHOW COLUMNS FROM bio_enrolled_users WHERE Field='employee_id'");
    console.log('Resulting Column Schema:', rows);
    
    await connection.end();
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

runMigration();
