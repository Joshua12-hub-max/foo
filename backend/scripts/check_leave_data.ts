import { db } from '../db/index.js';
import { leaveApplications } from '../db/schema.js';
import { sql } from 'drizzle-orm';

async function checkLeaves() {
  try {
    const rows = await db.select({
      id: leaveApplications.id,
      employeeId: leaveApplications.employeeId,
      leaveType: leaveApplications.leaveType,
      workingDays: leaveApplications.workingDays,
      daysWithPay: leaveApplications.daysWithPay,
      daysWithoutPay: leaveApplications.daysWithoutPay
    }).from(leaveApplications).limit(10);
    
    console.log('--- LEAVE DATA SAMPLE ---');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkLeaves();
