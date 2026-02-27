import { db } from '../db/index.js';
import { dailyTimeRecords } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
    console.log("Checking raw statuses for CHRMO-004");
    const dtrs = await db.select().from(dailyTimeRecords).where(eq(dailyTimeRecords.employeeId, 'CHRMO-004'));
    const statusCounts: Record<string, number> = {};
    dtrs.forEach(record => {
        statusCounts[record.status || 'null'] = (statusCounts[record.status || 'null'] || 0) + 1;
    });
    console.log(JSON.stringify(statusCounts, null, 2));

    let sumLatesOnly = 0;
    let sumUndertimesOnly = 0;
    let sumLateUndertimes = 0;

    dtrs.forEach(record => {
        if (record.status === 'Late') sumLatesOnly++;
        if (record.status === 'Undertime') sumUndertimesOnly++;
        if (record.status === 'Late/Undertime') sumLateUndertimes++;
    });

    console.log("Raw Lates Only: ", sumLatesOnly);
    console.log("Raw Undertimes Only: ", sumUndertimesOnly);
    console.log("Raw Late/Undertime: ", sumLateUndertimes);

    process.exit(0);
}
run();
