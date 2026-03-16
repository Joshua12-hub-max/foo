import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function debugShiftTemplates() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
  };

  console.log('Connecting to database:', config.database);

  try {
    const connection = await mysql.createConnection(config);
    
    // 1. Check if table exists
    const [tables] = await connection.execute("SHOW TABLES LIKE 'shift_templates'");
    if ((tables as any[]).length === 0) {
      console.error('CRITICAL: table "shift_templates" DOES NOT EXIST in the database!');
      await connection.end();
      return;
    }
    console.log('SUCCESS: Table "shift_templates" exists.');

    // 2. Count rows
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM shift_templates');
    const count = (rows as any[])[0].count;
    console.log(`Row count in shift_templates: ${count}`);

    // 3. List all rows
    if (count > 0) {
      const [allRows] = await connection.execute('SELECT * FROM shift_templates');
      console.log('--- DATA IN SHIFT_TEMPLATES ---');
      console.table(allRows);
    } else {
      console.warn('WARNING: shift_templates table is EMPTY!');
    }

    await connection.end();
  } catch (error) {
    console.error('Error during debugging:', error);
  }
}

debugShiftTemplates();
