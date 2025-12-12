import db from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runMigration = async () => {
  console.log('🚀 Starting SPMS Enhancement Migration...\n');

  try {
    const sqlFilePath = path.join(__dirname, 'spms_enhancement.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split by semicolon and filter empty statements
    const statements = sqlContent
      .split(';')
      .map(s => {
        // Remove comment lines to avoid skipping valid statements starting with comments
        const lines = s.split('\n');
        const cleanLines = lines.filter(line => !line.trim().startsWith('--'));
        return cleanLines.join('\n').trim();
      })
      .filter(s => s.length > 0);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        // Skip comments-only statements
        if (statement.split('\n').every(line => line.trim().startsWith('--') || line.trim() === '')) {
          continue;
        }

        await db.query(statement);
        successCount++;

        // Log what was created/altered
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
          console.log(`✅ Created table: ${tableName}`);
        } else if (statement.includes('ALTER TABLE')) {
          const tableName = statement.match(/ALTER TABLE (\w+)/)?.[1];
          console.log(`✅ Altered table: ${tableName}`);
        } else if (statement.includes('CREATE INDEX')) {
          console.log(`✅ Created index`);
        } else if (statement.includes('CREATE OR REPLACE VIEW')) {
          const viewName = statement.match(/VIEW (\w+)/)?.[1];
          console.log(`✅ Created view: ${viewName}`);
        } else if (statement.includes('INSERT')) {
          console.log(`✅ Inserted data`);
        }
      } catch (error) {
        if (error.code === 'ER_DUP_COLUMN' || error.code === 'ER_TABLE_EXISTS_ERROR') {
          skipCount++;
          console.log(`⏭️  Skipped (already exists): ${error.message.substring(0, 50)}...`);
        } else {
          errorCount++;
          console.error(`❌ Error: ${error.message.substring(0, 100)}...`);
        }
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 SPMS Enhancement Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please review above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    process.exit(0);
  }
};

runMigration();
