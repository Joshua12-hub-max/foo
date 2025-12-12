/**
 * SPMS Full Compliance Migration Runner
 * Run this to add all missing SPMS tables for CSC MC 6-2012 compliance
 */

import db from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
  console.log('🚀 Starting SPMS Full Compliance Migration...\n');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'spms_full_compliance_migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolons and filter empty statements
    const statements = sql
      .split(';')
      .map(s => {
          // Remove comment lines
          const lines = s.split('\n');
          const cleanLines = lines.filter(line => !line.trim().startsWith('--'));
          return cleanLines.join('\n').trim();
      })
      .filter(s => s.length > 0);
    
    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }
      
      try {
        await db.query(statement);
        successCount++;
        
        // Log table creations
        if (statement.includes('CREATE TABLE')) {
          const match = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
          if (match) {
            console.log(`✅ Created table: ${match[1]}`);
          }
        } else if (statement.includes('ALTER TABLE')) {
          const match = statement.match(/ALTER TABLE (\w+)/i);
          if (match) {
            console.log(`✅ Altered table: ${match[1]}`);
          }
        } else if (statement.includes('CREATE OR REPLACE VIEW')) {
          const match = statement.match(/CREATE OR REPLACE VIEW (\w+)/i);
          if (match) {
            console.log(`✅ Created view: ${match[1]}`);
          }
        }
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          skipCount++;
          console.log(`⏭️  Table already exists, skipping...`);
        } else if (error.code === 'ER_DUP_FIELDNAME') {
          skipCount++;
          console.log(`⏭️  Column already exists, skipping...`);
        } else if (error.code === 'ER_DUP_KEYNAME') {
          skipCount++;
          console.log(`⏭️  Key already exists, skipping...`);
        } else {
          errorCount++;
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    
    // Verify tables were created
    console.log('\n🔍 Verifying new tables...');
    const [tables] = await db.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME LIKE 'spms_%'
      ORDER BY TABLE_NAME
    `);
    
    console.log(`\n📋 SPMS Tables in database (${tables.length} total):`);
    tables.forEach(t => console.log(`   - ${t.TABLE_NAME}`));
    
    console.log('\n✨ SPMS Full Compliance Migration completed!\n');
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await db.end();
  }
};

runMigration();
