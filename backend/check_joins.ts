import { db } from './db/index.js';
import { pdsHrDetails, bioEnrolledUsers } from './db/schema.js';
import { sql, eq } from 'drizzle-orm';

async function checkJoins() {
  console.log('--- CHECKING JOIN DUPLICATES FOR EMP-001 ---');
  const ID = 'Emp-001';

  // 1. Check pdsHrDetails
  const hr = await db.select().from(pdsHrDetails);
  // We need to find the numeric ID for Emp-001 first
  const { authentication } = await import('./db/schema.js');
  const [user] = await db.select().from(authentication).where(eq(authentication.employeeId, ID));
  
  if (user) {
    const hrRecs = await db.select().from(pdsHrDetails).where(eq(pdsHrDetails.employeeId, user.id));
    console.log(`pdsHrDetails records for numeric ID ${user.id}:`, hrRecs.length);
  }

  // 2. Check bioEnrolledUsers
  const bio = await db.select().from(bioEnrolledUsers).where(eq(bioEnrolledUsers.employeeId, ID));
  console.log(`bioEnrolledUsers records for ${ID}:`, bio.length);
  if (bio.length > 1) {
    console.log('DUPLICATE BIO ENROLLMENT DETECTED:', bio.map(b => b.id));
  }

  process.exit(0);
}

checkJoins().catch(err => {
  console.error(err);
  process.exit(1);
});
