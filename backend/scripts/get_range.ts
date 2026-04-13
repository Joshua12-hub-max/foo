import { db } from '../db/index.js';
import { attendanceLogs } from '../db/schema.js';
import { sql } from 'drizzle-orm';

async function getRange() {
  const [res] = await db.execute(sql.raw('SELECT MIN(DATE(scan_time)) as minDate, MAX(DATE(scan_time)) as maxDate FROM attendance_logs'));
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}

getRange();
