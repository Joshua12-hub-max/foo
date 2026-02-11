
import { db } from './db/index.js';
import { leaveApplications } from './db/schema.js';
import { desc } from 'drizzle-orm';

async function run() {
    console.log('Checking Leave Applications...');
    
    const apps = await db.select().from(leaveApplications).orderBy(desc(leaveApplications.startDate)).limit(10);
    
    if (apps.length === 0) {
        console.log('❌ No leave applications found!');
    } else {
        console.log(`✅ Found ${apps.length} recent applications:`);
        apps.forEach(a => {
            console.log(`- ID: ${a.id} | Emp: ${a.employeeId} | Type: ${a.leaveType} | Dates: ${a.startDate} to ${a.endDate} | Status: ${a.status}`);
        });
    }
    process.exit(0);
}

run();
