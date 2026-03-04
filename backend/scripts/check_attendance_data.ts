import { db } from '../db/index.js';
import { dailyTimeRecords } from '../db/schema.js';
import { between, sql } from 'drizzle-orm';

async function checkAttendance() {
  try {
    const startDate = '2026-02-02';
    const endDate = '2026-02-16';

    console.log(`Checking attendance between ${startDate} and ${endDate}...`);

    const records = await db.select()
      .from(dailyTimeRecords)
      .where(between(dailyTimeRecords.date, startDate, endDate))
      .limit(10);

    console.log(`Found ${records.length} records in range.`);
    if (records.length > 0) {
      console.log('Sample record:', JSON.stringify(records[0], null, 2));
    }

    const totalCount = await db.select({ count: sql<number>`count(*)` })
      .from(dailyTimeRecords);
    
    console.log('Total records in dailyTimeRecords:', totalCount[0].count);

    process.exit(0);
  } catch (err) {
    console.error('Error checking attendance:', err);
    process.exit(1);
  }
}

checkAttendance();
