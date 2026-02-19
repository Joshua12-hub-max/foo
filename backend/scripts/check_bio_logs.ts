
import { db } from '../db/index.js';
import { bioAttendanceLogs, bioEnrolledUsers } from '../db/schema.js';
import { sql } from 'drizzle-orm';

async function checkBioLogs() {
    console.log('--- Checking Biometric Data ---');
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(bioEnrolledUsers);
    const logCount = await db.select({ count: sql<number>`count(*)` }).from(bioAttendanceLogs);

    console.log(`Bio Enrolled Users: ${userCount[0].count}`);
    console.log(`Bio Attendance Logs: ${logCount[0].count}`);
    
    if (logCount[0].count > 0) {
        const logs = await db.select().from(bioAttendanceLogs).limit(5);
        console.log('Recent Logs:', logs);
    }
    process.exit();
}

checkBioLogs();
