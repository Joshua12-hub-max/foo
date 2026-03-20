import { db } from './db/index.js';
import { schedules, dailyTimeRecords } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function audit() {
    console.log("--- SCHEDULES FOR EMP-001 ---");
    const scheds = await db.select().from(schedules).where(eq(schedules.employeeId, 'Emp-001'));
    console.log(scheds);

    console.log("\n--- RECENT DTR FOR EMP-001 ---");
    const dtrs = await db.select().from(dailyTimeRecords).where(eq(dailyTimeRecords.employeeId, 'Emp-001')).limit(5);
    console.log(dtrs.map(d => ({ date: d.date, timeIn: d.timeIn, timeOut: d.timeOut })));
    process.exit(0);
}
audit();
