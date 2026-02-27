import { db } from '../db/index.js';

async function runMigrate() {
  console.log('Running migrations manually...');
  try {
    // Generate the raw SQL commands required
    await db.execute(`
      ALTER TABLE \`authentication\` MODIFY COLUMN \`appointment_type\` enum('Permanent','Contractual','Casual','Job Order','Coterminous','Temporary','Contract of Service','JO','COS');
    `);
    
    await db.execute(`
      ALTER TABLE \`employee_memos\` MODIFY COLUMN \`memo_type\` enum('Verbal Warning','Written Warning','Reprimand','Suspension Notice','Termination Notice','Show Cause') NOT NULL DEFAULT 'Written Warning';
    `);

    await db.execute(`
      ALTER TABLE \`employee_memos\` ADD COLUMN \`severity\` enum('minor','moderate','major','grave','terminal') NOT NULL DEFAULT 'minor';
    `);

    await db.execute(`
      ALTER TABLE \`policy_violations\` ADD COLUMN \`violation_subtype\` varchar(50);
    `);

    await db.execute(`
      ALTER TABLE \`policy_violations\` ADD COLUMN \`offense_number\` int NOT NULL DEFAULT 1;
    `);

    await db.execute(`
      ALTER TABLE \`policy_violations\` ADD COLUMN \`triggered_months\` text;
    `);

    await db.execute(`
      ALTER TABLE \`policy_violations\` ADD COLUMN \`fingerprint\` varchar(255);
    `);

    await db.execute(`
      CREATE UNIQUE INDEX \`unique_fingerprint_violation\` ON \`policy_violations\` (\`fingerprint\`);
    `);

    console.log('Migrations applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

runMigrate();
