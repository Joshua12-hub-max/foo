import { db } from '../db/index.js';
import { dailyTimeRecords, authentication } from '../db/schema.js';
import { eq, like } from 'drizzle-orm';

async function run() {
    console.log("Starting script...");
    const users = await db.select().from(authentication).where(like(authentication.firstName, '%Cristina%'));
    if (users.length === 0) { console.log("User not found"); process.exit(0); }
    const employeeId = users[0].employeeId;
    console.log("Checking for Employee ID:", employeeId);
    
    const dtrs = await db.select().from(dailyTimeRecords).where(eq(dailyTimeRecords.employeeId, employeeId));
    let lates = 0, undertimes = 0, absences = 0, present = 0;
    const monthStats: any = {};
    dtrs.forEach(record => {
        const month = record.date.substring(0, 7);
        if (!monthStats[month]) monthStats[month] = { lates: 0, undertimes: 0, absences: 0, present: 0 };
        const isStatusLate = record.status === 'Late' || record.status === 'Late/Undertime';
        const isStatusUndertime = record.status === 'Undertime' || record.status === 'Late/Undertime';
        if (isStatusLate || (record.lateMinutes && record.lateMinutes > 0)) { lates++; monthStats[month].lates++; }
        if (isStatusUndertime || (record.undertimeMinutes && record.undertimeMinutes > 0)) { undertimes++; monthStats[month].undertimes++; }
        if (record.status === 'Absent' || record.status === 'AWOL') { absences++; monthStats[month].absences++; }
        if (record.status === 'Present') { present++; monthStats[month].present++; }
    });
    console.log(JSON.stringify({ total: {lates, undertimes, absences, present}, monthStats }, null, 2));
    process.exit(0);
}
run();
