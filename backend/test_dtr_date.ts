import { db } from './db/index.js';
import { dailyTimeRecords } from './db/tables/attendance.js';

async function run() {
  try {
    const logs = await db.select({ date: dailyTimeRecords.date }).from(dailyTimeRecords).limit(1);
    if (logs.length > 0) {
      console.log('Date value:', logs[0].date);
      console.log('Date type:', typeof logs[0].date);
      if (logs[0].date instanceof Date) {
        console.log('Is Date object:', true);
        console.log('Stringified:', String(logs[0].date));
      }
    } else {
      console.log('No logs found to test.');
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();