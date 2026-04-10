import { db } from './db/index.js';
import { bioEnrolledUsers } from './db/schema.js';
import { eq, or } from 'drizzle-orm';

async function checkBio() {
  console.log('--- CHECKING BIOMETRIC ENROLLMENT FOR EMP-004 ---');
  const ID = 'Emp-004';

  const bio = await db.select().from(bioEnrolledUsers).where(
    or(
      eq(bioEnrolledUsers.employeeId, ID),
      eq(bioEnrolledUsers.employeeId, '4')
    )
  );

  console.log(`Found ${bio.length} record(s) for ${ID}:`);
  bio.forEach(b => {
    console.log(`- ID: ${b.employeeId}, Name: ${b.fullName}, Status: ${b.userStatus}, Created: ${b.createdAt}`);
  });

  process.exit(0);
}

checkBio().catch(err => {
  console.error(err);
  process.exit(1);
});
