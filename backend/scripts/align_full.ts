import 'dotenv/config';
import pool from '../db/index.js';

/**
 * This script manually applies all remaining schema diffs that
 * `drizzle-kit push` was unable to apply due to its interactive
 * data-loss confirmation prompt.
 */
async function alignFull() {
  console.log('=== Full DB Schema Alignment ===');
  const conn = await pool.getConnection();

  const exec = async (label: string, sql: string) => {
    try {
      await conn.query(sql);
      console.log(`${label}`);
    } catch (err: any) {
      if (
        err.code === 'ER_DUP_FIELDNAME' ||
        err.code === 'ER_TABLE_EXISTS_ERROR' ||
        err.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
        err.code === 'ER_DUP_KEYNAME' ||
        err.code === 'ER_BAD_FIELD_ERROR'
      ) {
        console.log(`${label} (already done or N/A: ${err.code})`);
      } else {
        console.error(`${label}:`, err.message);
      }
    }
  };

  // ── 1. Create missing tables ──────────────────────────────────────────

  await exec('Create fingerprints table',
    `CREATE TABLE IF NOT EXISTS \`fingerprints\` (
      \`fingerprint_id\` int NOT NULL,
      \`employee_id\` varchar(50) NOT NULL,
      \`template\` longtext,
      \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`fingerprint_id\`),
      UNIQUE KEY \`employee_id\` (\`employee_id\`)
    )`
  );

  await exec('Create recruitment_security_logs table',
    `CREATE TABLE IF NOT EXISTS \`recruitment_security_logs\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`job_id\` int,
      \`first_name\` varchar(100),
      \`last_name\` varchar(100),
      \`email\` varchar(255),
      \`violation_type\` varchar(100),
      \`details\` text,
      \`ip_address\` varchar(45),
      \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    )`
  );

  // ── 2. Add missing columns to authentication ──────────────────────────

  await exec('Add experience to authentication',
    `ALTER TABLE \`authentication\` ADD COLUMN \`experience\` text`
  );

  await exec('Add skills to authentication',
    `ALTER TABLE \`authentication\` ADD COLUMN \`skills\` text`
  );

  // ── 3. Type changes on authentication ─────────────────────────────────

  await exec('Change years_of_experience from int to varchar(50)',
    `ALTER TABLE \`authentication\` MODIFY COLUMN \`years_of_experience\` varchar(50)`
  );

  // ── 4. Add missing columns to schedules ───────────────────────────────

  await exec('Add is_rest_day to schedules',
    `ALTER TABLE \`schedules\` ADD COLUMN \`is_rest_day\` tinyint(1) DEFAULT 0`
  );

  await exec('Add is_special to schedules',
    `ALTER TABLE \`schedules\` ADD COLUMN \`is_special\` tinyint(1) DEFAULT 0`
  );

  // ── 5. Drop legacy columns that Drizzle schema no longer defines ──────
  // These are columns in the DB that are NOT in the Drizzle schema.
  // Drizzle push was trying to drop them, causing the data-loss warning.

  const legacyAuthCols = [
    'sss_number', 'sss_no', 'citizenship', 'citizenship_type', 
    'dual_citizenship_country', 'two_factor_secret'
  ];
  for (const col of legacyAuthCols) {
    await exec(`Drop auth.${col}`,
      `ALTER TABLE \`authentication\` DROP COLUMN \`${col}\``
    );
  }

  // recruitment_jobs legacy columns
  const legacyJobCols = ['salary_range'];
  for (const col of legacyJobCols) {
    await exec(`Drop recruitment_jobs.${col}`,
      `ALTER TABLE \`recruitment_jobs\` DROP COLUMN \`${col}\``
    );
  }

  // ── 6. Fix boolean types (tinyint(1) ↔ boolean mapping) ───────────────
  // MySQL boolean IS tinyint(1), so these should be no-ops if already correct.
  // But Drizzle differentiates tinyint vs tinyint(1), so ensure display width.

  await exec('Fix is_verified to tinyint(1)',
    `ALTER TABLE \`authentication\` MODIFY COLUMN \`is_verified\` tinyint(1) DEFAULT 0`
  );

  await exec('Fix is_regular to tinyint(1)',
    `ALTER TABLE \`authentication\` MODIFY COLUMN \`is_regular\` tinyint(1) DEFAULT 0`
  );

  await exec('Fix two_factor_enabled to tinyint(1)',
    `ALTER TABLE \`authentication\` MODIFY COLUMN \`two_factor_enabled\` tinyint(1) DEFAULT 0`
  );

  // google_calendar_tokens
  await exec('Fix sync_enabled to tinyint(1)',
    `ALTER TABLE \`google_calendar_tokens\` MODIFY COLUMN \`sync_enabled\` tinyint(1) DEFAULT 1`
  );

  // ── 7. Fix bio_attendance_logs primary key ────────────────────────────
  // Already fixed in Drizzle schema to use inline primaryKey()

  // ── Done ──────────────────────────────────────────────────────────────

  conn.release();
  console.log('\n=== Alignment Complete! ===');
  console.log('Run `npx tsx node_modules/drizzle-kit/bin.cjs push` again to verify no diffs remain.');
  await pool.end();
}

alignFull().catch((err) => {
  console.error('Alignment script failed:', err);
  process.exit(1);
});
