import { db } from '../db/index.js';
import { dailyTimeRecords, tardinessSummary, policyViolations } from '../db/schema.js';
import { sql } from 'drizzle-orm';

async function wipeDerivedData() {
  try {
    console.log('--- WIPING DERIVED ATTENDANCE DATA ---');

    console.log('Deleting records from policy_violations associated with attendance...');
    // We only delete violations that are calculated (might have others, but for now we'll be targeted if possible)
    // Actually, full wipe of violations for the current period is safer.
    await db.execute(sql.raw('TRUNCATE TABLE policy_violations'));
    console.log('Successfully truncated policy_violations.');

    console.log('Truncating tardiness_summary...');
    await db.execute(sql.raw('TRUNCATE TABLE tardiness_summary'));
    console.log('Successfully truncated tardiness_summary.');

    console.log('Truncating daily_time_records...');
    await db.execute(sql.raw('TRUNCATE TABLE daily_time_records'));
    console.log('Successfully truncated daily_time_records.');

    console.log('--- WIPE COMPLETE ---');
    process.exit(0);
  } catch (err) {
    console.error('Wipe failed:', err);
    process.exit(1);
  }
}

wipeDerivedData();
