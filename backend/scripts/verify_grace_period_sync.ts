import { db } from '../db/index.js';
import { dailyTimeRecords, authentication, pdsHrDetails, internalPolicies } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { calculateLateUndertime, determineStatus } from '../utils/attendanceUtils.js';

async function verifyGracePeriod() {
  console.log('--- DIAGNOSTIC: Grace Period Consistency Verification ---');

  const testEmployeeId = 'Emp-001'; // Adjust if needed
  const testDate = '2026-03-27';
  
  // 1. Fetch Policy
  const [policy] = await db.select().from(internalPolicies).where(eq(internalPolicies.category, 'tardiness')).limit(1);
  const gracePeriod = policy?.content ? (JSON.parse(typeof policy.content === 'string' ? policy.content : JSON.stringify(policy.content)).gracePeriod || 0) : 0;
  console.log(`System Grace Period: ${gracePeriod} minutes`);

  // 2. Mock a 14-minute late arrival (8:14 AM for a 8:00 AM shift)
  const scheduledStart = new Date(`${testDate} 08:00:00`);
  const scheduledEnd = new Date(`${testDate} 17:00:00`);
  const actualIn = new Date(`${testDate} 08:14:00`);
  const actualOut = new Date(`${testDate} 17:00:00`);

  console.log(`Test Scenario: In at ${actualIn.toLocaleTimeString()}, Scheduled ${scheduledStart.toLocaleTimeString()}`);

  const { lateMinutes, undertimeMinutes } = calculateLateUndertime(
    actualIn,
    actualOut,
    scheduledStart,
    scheduledEnd,
    Number(gracePeriod)
  );

  const status = determineStatus(lateMinutes, undertimeMinutes);

  console.log(`Result: Late Minutes = ${lateMinutes}, Status = ${status}`);

  if (lateMinutes === 0 && status === 'Present') {
    console.log('✅ SUCCESS: 14-minute lateness correctly ignored (Grace Period Applied).');
  } else {
    console.error('❌ FAILURE: Grace period logic mismatch.');
    process.exit(1);
  }

  // 3. Mock a 20-minute late arrival (should result in 5 minutes late if grace is 15)
  const actualIn20 = new Date(`${testDate} 08:20:00`);
  const { lateMinutes: late20 } = calculateLateUndertime(
    actualIn20,
    actualOut,
    scheduledStart,
    scheduledEnd,
    Number(gracePeriod)
  );
  
  const expectedLate = gracePeriod >= 15 ? 5 : (20 - Number(gracePeriod));
  console.log(`Test Scenario (20m late): Result Late = ${late20}, Expected = ${expectedLate}`);

  if (late20 === expectedLate) {
    console.log('✅ SUCCESS: 20-minute lateness correctly deducted grace period.');
  } else {
    console.error('❌ FAILURE: Deductive grace period logic mismatch.');
    process.exit(1);
  }

  console.log('--- Verification Complete ---');
  process.exit(0);
}

verifyGracePeriod().catch(err => {
  console.error(err);
  process.exit(1);
});
