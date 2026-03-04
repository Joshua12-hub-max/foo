import 'dotenv/config';
import pool from '../db/index.js';

/**
 * Drops any FK constraints that are blocking drizzle-kit push,
 * so Drizzle can re-create them with the correct schema names.
 */
async function run(): Promise<void> {
  const conn = await pool.getConnection();

  const exec = async (label: string, sql: string): Promise<void> => {
    try {
      await conn.query(sql);
      console.log(`✅ ${label}`);
    } catch (err: unknown) {
      const dbErr = err as { code?: string; message?: string };
      if (dbErr.code === 'ER_CANT_DROP_FIELD_OR_KEY' || dbErr.code === 'ER_CHECK_CONSTRAINT_NOT_FOUND') {
        console.log(`⏭️  ${label} (already gone)`);
      } else {
        console.error(`❌ ${label}: ${dbErr.message}`);
      }
    }
  };

  // First, find the FK name that uses fk_auth_plantilla index
  const [rows] = await conn.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'authentication' 
     AND CONSTRAINT_TYPE = 'FOREIGN KEY'`
  ) as [Array<{ CONSTRAINT_NAME: string }>, unknown];

  console.log('FK constraints on authentication:', rows.map((r: { CONSTRAINT_NAME: string }) => r.CONSTRAINT_NAME));

  // Drop all FK constraints related to plantilla
  for (const row of rows) {
    if (row.CONSTRAINT_NAME.toLowerCase().includes('plantilla') || row.CONSTRAINT_NAME === 'fk_auth_plantilla') {
      await exec(`Drop FK ${row.CONSTRAINT_NAME}`,
        `ALTER TABLE \`authentication\` DROP FOREIGN KEY \`${row.CONSTRAINT_NAME}\``
      );
    }
  }

  // Now try to drop the index
  await exec('Drop index fk_auth_plantilla',
    'ALTER TABLE `authentication` DROP INDEX `fk_auth_plantilla`'
  );

  conn.release();
  await pool.end();
  console.log('\nDone! Run drizzle push again.');
}

run();
