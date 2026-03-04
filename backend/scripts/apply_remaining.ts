import 'dotenv/config';
import pool from '../db/index.js';

/**
 * Applies ALL remaining schema changes that drizzle-kit push cannot handle
 * because of ER_TRUNCATE_ILLEGAL_FK errors on tables with foreign keys.
 * 
 * Instead of truncating tables, we directly ALTER them.
 */
async function applyRemaining(): Promise<void> {
  console.log('=== Applying Remaining Schema Changes ===\n');
  const conn = await pool.getConnection();

  const exec = async (label: string, sql: string): Promise<void> => {
    try {
      await conn.query(sql);
      console.log(`✅ ${label}`);
    } catch (err: unknown) {
      const dbErr = err as { code?: string; message?: string };
      if (
        dbErr.code === 'ER_DUP_FIELDNAME' ||
        dbErr.code === 'ER_TABLE_EXISTS_ERROR' ||
        dbErr.code === 'ER_CANT_DROP_FIELD_OR_KEY' ||
        dbErr.code === 'ER_DUP_KEYNAME' ||
        dbErr.code === 'ER_BAD_FIELD_ERROR'
      ) {
        console.log(`⏭️  ${label} (already done: ${dbErr.code})`);
      } else {
        console.error(`❌ ${label}: ${dbErr.message}`);
      }
    }
  };

  // Disable FK checks so we can ALTER tables freely
  await exec('Disable FK checks', 'SET FOREIGN_KEY_CHECKS = 0');

  // ── 1. Enum modifications (the cause of truncation errors) ────────────

  // recruitment_jobs.employment_type - add new enum values
  await exec('Update recruitment_jobs.employment_type enum',
    `ALTER TABLE \`recruitment_jobs\` MODIFY COLUMN \`employment_type\` enum('Full-time','Part-time','Contractual','Job Order','Coterminous','Temporary','Probationary','Casual','Permanent') DEFAULT 'Full-time'`
  );

  // recruitment_applicants.interview_platform - add 'Jitsi Meet'
  await exec('Update recruitment_applicants.interview_platform enum',
    `ALTER TABLE \`recruitment_applicants\` MODIFY COLUMN \`interview_platform\` enum('Jitsi Meet','Google Meet','Zoom','Other') DEFAULT 'Google Meet'`
  );

  // leave_balances.credit_type - add 'Adoption Leave'
  await exec('Update leave_balances.credit_type enum',
    `ALTER TABLE \`leave_balances\` MODIFY COLUMN \`credit_type\` enum('Vacation Leave','Sick Leave','Special Privilege Leave','Forced Leave','Maternity Leave','Paternity Leave','Solo Parent Leave','Study Leave','Adoption Leave') NOT NULL`
  );

  // leave_ledger.credit_type - add 'Adoption Leave'
  await exec('Update leave_ledger.credit_type enum',
    `ALTER TABLE \`leave_ledger\` MODIFY COLUMN \`credit_type\` enum('Vacation Leave','Sick Leave','Special Privilege Leave','Forced Leave','Maternity Leave','Paternity Leave','Solo Parent Leave','Study Leave','Adoption Leave') NOT NULL`
  );

  // ── 2. Boolean column type fixes (tinyint → boolean/tinyint(1)) ───────
  // These are the columns that Drizzle was trying to "truncate" for
  // We ALTER them in-place instead

  // recruitment_jobs boolean columns
  await exec('Fix recruitment_jobs.require_civil_service',
    `ALTER TABLE \`recruitment_jobs\` MODIFY COLUMN \`require_civil_service\` tinyint(1) DEFAULT 0`
  );
  await exec('Fix recruitment_jobs.require_government_ids',
    `ALTER TABLE \`recruitment_jobs\` MODIFY COLUMN \`require_government_ids\` tinyint(1) DEFAULT 0`
  );
  await exec('Fix recruitment_jobs.require_education_experience',
    `ALTER TABLE \`recruitment_jobs\` MODIFY COLUMN \`require_education_experience\` tinyint(1) DEFAULT 0`
  );

  // chat_messages
  await exec('Fix chat_messages.is_read',
    `ALTER TABLE \`chat_messages\` MODIFY COLUMN \`is_read\` tinyint(1) DEFAULT 0`
  );

  // recruitment_applicants
  await exec('Fix recruitment_applicants.is_meycauayan_resident',
    `ALTER TABLE \`recruitment_applicants\` MODIFY COLUMN \`is_meycauayan_resident\` tinyint(1) DEFAULT 0`
  );

  // qualification_standards
  await exec('Fix qualification_standards.is_active',
    `ALTER TABLE \`qualification_standards\` MODIFY COLUMN \`is_active\` tinyint(1) DEFAULT 1`
  );

  // plantilla_positions
  await exec('Fix plantilla_positions.is_vacant',
    `ALTER TABLE \`plantilla_positions\` MODIFY COLUMN \`is_vacant\` tinyint(1) DEFAULT 1`
  );
  await exec('Fix plantilla_positions.is_coterminous',
    `ALTER TABLE \`plantilla_positions\` MODIFY COLUMN \`is_coterminous\` tinyint(1) DEFAULT 0`
  );

  // performance_criteria
  await exec('Fix performance_criteria.is_active',
    `ALTER TABLE \`performance_criteria\` MODIFY COLUMN \`is_active\` tinyint(1) DEFAULT 1`
  );

  // performance_review_cycles
  await exec('Fix performance_review_cycles.is_active',
    `ALTER TABLE \`performance_review_cycles\` MODIFY COLUMN \`is_active\` tinyint(1) DEFAULT 1`
  );

  // performance_reviews
  await exec('Fix performance_reviews.disagreed',
    `ALTER TABLE \`performance_reviews\` MODIFY COLUMN \`disagreed\` tinyint(1) DEFAULT 0`
  );
  await exec('Fix performance_reviews.is_self_assessment',
    `ALTER TABLE \`performance_reviews\` MODIFY COLUMN \`is_self_assessment\` tinyint(1) DEFAULT 0`
  );

  // pds_work_experience
  await exec('Fix pds_work_experience.is_government',
    `ALTER TABLE \`pds_work_experience\` MODIFY COLUMN \`is_government\` tinyint(1) DEFAULT 0`
  );

  // employee_education
  await exec('Fix employee_education.is_current',
    `ALTER TABLE \`employee_education\` MODIFY COLUMN \`is_current\` tinyint(1) DEFAULT 0`
  );

  // employee_emergency_contacts
  await exec('Fix employee_emergency_contacts.is_primary',
    `ALTER TABLE \`employee_emergency_contacts\` MODIFY COLUMN \`is_primary\` tinyint(1) DEFAULT 0`
  );

  // employee_employment_history
  await exec('Fix employee_employment_history.is_current',
    `ALTER TABLE \`employee_employment_history\` MODIFY COLUMN \`is_current\` tinyint(1) DEFAULT 0`
  );

  // employee_memos
  await exec('Fix employee_memos.acknowledgment_required',
    `ALTER TABLE \`employee_memos\` MODIFY COLUMN \`acknowledgment_required\` tinyint(1) DEFAULT 0`
  );

  // employee_notes
  await exec('Fix employee_notes.is_private',
    `ALTER TABLE \`employee_notes\` MODIFY COLUMN \`is_private\` tinyint(1) DEFAULT 1`
  );

  // service_records
  await exec('Fix service_records.is_with_pay',
    `ALTER TABLE \`service_records\` MODIFY COLUMN \`is_with_pay\` tinyint(1) DEFAULT 1`
  );

  // salary_tranches
  await exec('Fix salary_tranches.is_active',
    `ALTER TABLE \`salary_tranches\` MODIFY COLUMN \`is_active\` tinyint(1) DEFAULT 0`
  );

  // leave_applications
  await exec('Fix leave_applications.is_with_pay',
    `ALTER TABLE \`leave_applications\` MODIFY COLUMN \`is_with_pay\` tinyint(1) DEFAULT 1 NOT NULL`
  );

  // leave_requests
  await exec('Fix leave_requests.with_pay',
    `ALTER TABLE \`leave_requests\` MODIFY COLUMN \`with_pay\` tinyint(1) DEFAULT 0`
  );

  // ── 3. Drop legacy columns from recruitment_applicants ────────────────

  const legacyApplicantCols = [
    'nationality', 'telephone_no', 'emergency_contact', 
    'emergency_contact_number', 'facebook_url', 'linkedin_url', 'twitter_handle'
  ];
  for (const col of legacyApplicantCols) {
    await exec(`Drop recruitment_applicants.${col}`,
      `ALTER TABLE \`recruitment_applicants\` DROP COLUMN \`${col}\``
    );
  }

  // ── 4. Drop legacy column from internal_policies ──────────────────────

  await exec('Drop internal_policies.created_at',
    `ALTER TABLE \`internal_policies\` DROP COLUMN \`created_at\``
  );

  // ── 5. Create missing tables ──────────────────────────────────────────

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
      PRIMARY KEY (\`id\`),
      INDEX \`idx_violation\` (\`violation_type\`)
    )`
  );

  // ── 6. Add missing columns ────────────────────────────────────────────

  await exec('Add experience to authentication',
    `ALTER TABLE \`authentication\` ADD COLUMN \`experience\` text`
  );

  await exec('Add skills to authentication',
    `ALTER TABLE \`authentication\` ADD COLUMN \`skills\` text`
  );

  await exec('Fix authentication.years_of_experience type',
    `ALTER TABLE \`authentication\` MODIFY COLUMN \`years_of_experience\` varchar(50)`
  );

  // schedules boolean columns
  await exec('Add is_rest_day to schedules',
    `ALTER TABLE \`schedules\` ADD COLUMN \`is_rest_day\` tinyint(1) DEFAULT 0`
  );

  await exec('Add is_special to schedules',
    `ALTER TABLE \`schedules\` ADD COLUMN \`is_special\` tinyint(1) DEFAULT 0`
  );

  // ── Re-enable FK checks ───────────────────────────────────────────────
  await exec('Re-enable FK checks', 'SET FOREIGN_KEY_CHECKS = 1');

  conn.release();
  console.log('\n=== All Changes Applied! ===');
  console.log('Run `pnpx tsx node_modules/drizzle-kit/bin.cjs push` again to verify schema is in sync.');
  await pool.end();
}

applyRemaining().catch((err: unknown) => {
  console.error('Script failed:', err);
  process.exit(1);
});
