
import { db } from './db/index.js';
import { leaveApplications, authentication } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
    console.log('--- Seeding ONE Active Leave for TODAY ---');
    
    // Get today's date
    const todayStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());

    const employeeId = 'EMP-2024-1002'; // Ron Micheal Nito
    
    console.log(`Creating active leave for ${employeeId} on ${todayStr}...`);
    
    await db.insert(leaveApplications).values({
        employeeId,
        leaveType: 'Vacation Leave',
        startDate: todayStr,
        endDate: todayStr,
        workingDays: '1.000',
        isWithPay: 1,
        actualPaymentStatus: 'WITH_PAY',
        daysWithPay: '1.000',
        daysWithoutPay: '0.000',
        reason: 'Seeded Active Leave for Testing',
        status: 'Approved', // Already approved!
        createdAt: todayStr + ' 08:00:00',
        approvedBy: 'System', 
        approvedAt: todayStr + ' 08:30:00'
    });

    console.log('✅ Created! Please refresh dashboard.');
    process.exit(0);
}

run();
