import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const migrationPath = path.join(__dirname, 'drizzle/0004_harsh_nighthawk.sql');

async function fixMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chrmo_db',
  });

  try {
    const rawSql = fs.readFileSync(migrationPath, 'utf8');
    const statements = rawSql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
    
    const newStatements = [];
    
    for (const stmt of statements) {
      // Handle DROP INDEX
      if (stmt.startsWith('DROP INDEX `idx_employee_violation` ON `policy_violations`;')) {
         // Let's check if the index exists
         const [rows] = await connection.execute(`SHOW INDEX FROM policy_violations WHERE Key_name = 'idx_employee_violation'`);
         if ((rows as any[]).length === 0) {
            console.log('Skipping DROP INDEX idx_employee_violation (not exists)');
            continue;
         }
      }

      // Handle DROP COLUMN
      const dropMatch = stmt.match(/ALTER TABLE `([^`]+)` DROP COLUMN `([^`]+)`/);
      if (dropMatch) {
        const table = dropMatch[1];
        const col = dropMatch[2];
        const [rows] = await connection.execute(`SHOW COLUMNS FROM ${table} LIKE '${col}'`);
        if ((rows as any[]).length === 0) {
          console.log(`Skipping DROP COLUMN ${table}.${col} (not exists)`);
          continue;
        }
      }

      // Handle MODIFY COLUMN
      const modifyMatch = stmt.match(/ALTER TABLE `([^`]+)` MODIFY COLUMN `([^`]+)` (.*)/);
      if (modifyMatch) {
        const table = modifyMatch[1];
        const col = modifyMatch[2];
        const [rows] = await connection.execute(`SHOW COLUMNS FROM ${table} LIKE '${col}'`);
        if ((rows as any[]).length === 0) {
          console.log(`Changing MODIFY to ADD for ${table}.${col} (not exists)`);
          const addStmt = stmt.replace('MODIFY COLUMN', 'ADD');
          newStatements.push(addStmt);
          continue;
        }
      }

      newStatements.push(stmt);
    }

    const newSql = newStatements.join('--> statement-breakpoint\n');
    fs.writeFileSync(migrationPath, newSql);
    console.log('Migration fixed!');

  } catch (error) {
    console.error('Failed to fix migration:', error);
  } finally {
    await connection.end();
  }
}

fixMigration().catch(console.error);
