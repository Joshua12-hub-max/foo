import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function clearEntireDatabase() {
  const tablesToPreserve = [
    '__drizzle_migrations',
    'address_ref_barangays',
    'performance_criteria',
    'performance_review_cycles',
    'performance_templates'
  ];

  try {
    console.log('Fetching all tables and views...');
    // We can use SHOW FULL TABLES to distinguish between BASE TABLE and VIEW
    const [rows] = await db.execute(sql`SHOW FULL TABLES`);
    
    const tablesToTruncate: string[] = [];
    
    (rows as never[]).forEach(row => {
      const tableName = Object.values(row)[0] as string;
      const tableType = Object.values(row)[1] as string;
      
      if (tableType === 'BASE TABLE' && !tablesToPreserve.includes(tableName)) {
        tablesToTruncate.push(tableName);
      } else {
        console.log(`Skipping ${tableType}: ${tableName}`);
      }
    });

    console.log(`Will truncate ${tablesToTruncate.length} base tables.`);
    
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0`);

    for (const table of tablesToTruncate) {
      console.log(`Truncating table: ${table}`);
      try {
        await db.execute(sql.raw(`TRUNCATE TABLE \`${table}\``));
      } catch (err) {
        console.warn(`Failed to truncate ${table}, trying DELETE instead...`);
        try {
          await db.execute(sql.raw(`DELETE FROM \`${table}\``));
        } catch (deleteErr) {
          console.error(`COULD NOT CLEAR TABLE ${table}:`, deleteErr);
        }
      }
    }

    console.log('Resetting plantilla_positions incumbents...');
    await db.execute(sql`
      UPDATE plantilla_positions
      SET incumbent_id = NULL,
          is_vacant = 1,
          filled_date = NULL,
          vacated_date = NULL
    `);

    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    console.log('Database cleanup completed successfully.');
    console.log('Preserved (Exempted):', tablesToPreserve.join(', '));
  } catch (error) {
    console.error('Cleanup failed:', error);
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1`);
    process.exit(1);
  }
}

clearEntireDatabase().then(() => process.exit(0));
