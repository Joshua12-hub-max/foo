import db from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
  try {
    const sqlPath = path.join(__dirname, 'add_recruitment_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon to run multiple statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
        await db.query(statement);
    }
    
    console.log('✅ Recruitment tables created successfully.');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
};

runMigration();
