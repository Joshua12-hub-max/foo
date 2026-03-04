import 'dotenv/config';
import pool from '../db/index.js';

/**
 * Drops ALL legacy `fk_*` prefixed foreign key constraints and indexes
 * across EVERY table in the database.
 * Also handles cases where the FK constraint name differs from the index name.
 */
async function run(): Promise<void> {
  const conn = await pool.getConnection();

  const exec = async (label: string, sql: string): Promise<void> => {
    try {
      await conn.query(sql);
      console.log(`  ✅ ${label}`);
    } catch (err: unknown) {
      const dbErr = err as { code?: string; message?: string };
      if (dbErr.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log(`  ⏭️  ${label} (already gone)`);
      } else {
        console.error(`  ❌ ${label}: ${dbErr.code} - ${dbErr.message}`);
      }
    }
  };

  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  console.log('🔓 FK checks disabled\n');

  // Get all tables
  const [tables] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`
  ) as [Array<{ TABLE_NAME: string }>, unknown];

  let totalDropped = 0;

  for (const table of tables) {
    const tableName = table.TABLE_NAME;

    // Get ALL FK constraints on this table (not just fk_* named ones)
    const [allFKs] = await conn.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = ? 
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
      [tableName]
    ) as [Array<{ CONSTRAINT_NAME: string }>, unknown];

    // Get all fk_* indexes on this table
    let legacyIndexNames: string[] = [];
    try {
      const [indexes] = await conn.query(
        `SHOW INDEX FROM \`${tableName}\` WHERE Key_name LIKE 'fk_%'`
      ) as [Array<{ Key_name: string }>, unknown];
      legacyIndexNames = [...new Set(indexes.map((idx: { Key_name: string }) => idx.Key_name))];
    } catch { /* skip */ }

    // Also get fk_* FK constraint names
    const fkPrefixedConstraints = allFKs.filter(
      (fk: { CONSTRAINT_NAME: string }) => fk.CONSTRAINT_NAME.startsWith('fk_')
    );

    if (fkPrefixedConstraints.length === 0 && legacyIndexNames.length === 0) continue;

    console.log(`📋 ${tableName}:`);

    // Drop ALL FK constraints first (fk_* prefixed)
    for (const fk of fkPrefixedConstraints) {
      await exec(`DROP FK ${fk.CONSTRAINT_NAME}`,
        `ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``
      );
      totalDropped++;
    }

    // If there are legacy indexes, also drop any FK that might be blocking them
    // by dropping ALL FKs on this table (they'll be re-created by Drizzle)
    if (legacyIndexNames.length > 0) {
      // Drop ALL remaining FKs on the table to free up any index
      for (const fk of allFKs) {
        if (!fk.CONSTRAINT_NAME.startsWith('fk_')) {
          await exec(`DROP FK ${fk.CONSTRAINT_NAME} (to free indexes)`,
            `ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``
          );
          totalDropped++;
        }
      }

      // Now drop the legacy indexes
      for (const idxName of legacyIndexNames) {
        await exec(`DROP INDEX ${idxName}`,
          `ALTER TABLE \`${tableName}\` DROP INDEX \`${idxName}\``
        );
        totalDropped++;
      }
    }
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log('\n🔒 FK checks re-enabled');

  conn.release();
  await pool.end();
  console.log(`\n=== Done! ${totalDropped} total operations ===`);
}

run();
