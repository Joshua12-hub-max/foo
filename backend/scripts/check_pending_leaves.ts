import { db } from '../db/index.js';
import { leaveApplications, authentication, internalPolicies } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

async function checkLeaves() {
    try {
        console.log("--- Leave Applications ---");
        const allLeaves = await db.select()
            .from(leaveApplications)
            .leftJoin(authentication, eq(leaveApplications.employeeId, authentication.employeeId))
            .orderBy(desc(leaveApplications.createdAt));

        console.log(`Found ${allLeaves.length} total leave requests.`);
        allLeaves.forEach(p => {
            console.log(`ID: ${p.leave_applications.id}, Status: ${p.leave_applications.status}, Employee: ${p.authentication?.firstName} ${p.authentication?.lastName} (${p.leave_applications.employeeId}), Type: ${p.leave_applications.leaveType}, Dates: ${p.leave_applications.startDate} to ${p.leave_applications.endDate}`);
        });

        console.log("\n--- Leave Policy ---");
        const policies = await db.select().from(internalPolicies).where(eq(internalPolicies.category, 'leave'));
        if (policies.length === 0) {
            console.log("No leave policy found.");
        } else {
            console.log(JSON.stringify(JSON.parse(policies[0].content as string), null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkLeaves();
