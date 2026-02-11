
import { db } from './db/index.js';
import { leaveApplications, authentication } from './db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

async function run() {
    console.log('--- Debugging Dashboard Stats ---');

    // Mimic getLocalDate()
    const todayStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());

    console.log(`Today's Date (Manila): ${todayStr}`);

    // 1. Fetch ALL Approved leaves
    const allApproved = await db.select({
        id: leaveApplications.id,
        employee: leaveApplications.employeeId,
        start: leaveApplications.startDate,
        end: leaveApplications.endDate,
        status: leaveApplications.status
    })
    .from(leaveApplications)
    .where(eq(leaveApplications.status, 'Approved'));

    console.log(`\nTotal Approved Leaves: ${allApproved.length}`);
    allApproved.forEach(l => {
        const isActive = (todayStr >= l.start && todayStr <= l.end);
        console.log(`- ID ${l.id} (${l.employee}): ${l.start} to ${l.end}. Active Today? ${isActive ? 'YES ✅' : 'NO ❌'}`);
    });

    // 2. Run the EXACT query from controller
    const activeLeaves = await db.select({
      employeeId: leaveApplications.employeeId,
      startDate: leaveApplications.startDate,
      endDate: leaveApplications.endDate
    })
    .from(leaveApplications) // Using leaveApplications (ACTIVE TABLE)
    .innerJoin(authentication, eq(leaveApplications.employeeId, authentication.employeeId))
    .where(and(
      eq(leaveApplications.status, 'Approved'),
      sql`DATE(${todayStr}) >= DATE(${leaveApplications.startDate})`,
      sql`DATE(${todayStr}) <= DATE(${leaveApplications.endDate})`
    ));

    console.log(`\nQuery Result Count: ${activeLeaves.length}`);
    if (activeLeaves.length === 0) {
        console.log('⚠️ No active leaves found for TODAY.');
    } else {
        console.log('✅ Active leaves found:', activeLeaves);
    }

    process.exit(0);
}

run();
