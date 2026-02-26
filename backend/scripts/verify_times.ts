
import { db } from '../db/index.js';
import { dailyTimeRecords, authentication } from '../db/schema.js';
import { eq, desc, like } from 'drizzle-orm';

async function verifyTimes() {
  console.log('Verifying Attendance Times (Expect 08:xx and 17:xx)...');

  // Check 5 most recent DTRs for CHRMO
  const chrmoDTRs = await db.select({
      emp: authentication.firstName,
      date: dailyTimeRecords.date,
      timeIn: dailyTimeRecords.timeIn,
      timeOut: dailyTimeRecords.timeOut,
      status: dailyTimeRecords.status
  })
  .from(dailyTimeRecords)
  .leftJoin(authentication, eq(dailyTimeRecords.employeeId, authentication.employeeId))
  .where(like(authentication.department, '%Human Resources%'))
  .orderBy(desc(dailyTimeRecords.date))
  .limit(10);

  console.table(chrmoDTRs.map(d => ({
      ...d,
      inTimeOnly: d.timeIn ? d.timeIn.split(' ')[1] : '-',
      outTimeOnly: d.timeOut ? d.timeOut.split(' ')[1] : '-'
  })));

  process.exit(0);
}

verifyTimes();
