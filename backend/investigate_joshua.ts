import { db } from './db/index.js';
import { authentication } from './db/tables/auth.js';
import { pdsPersonalInformation, pdsHrDetails } from './db/tables/pds.js';
import { eq, like, or } from 'drizzle-orm';

async function main() {
  console.log('--- INVESTIGATING JOSHUA PALERO ---');

  const users = await db.select().from(authentication).where(
    or(
      like(authentication.firstName, '%Joshua%'),
      like(authentication.lastName, '%Palero%')
    )
  );

  if (users.length === 0) {
    console.log('Joshua Palero not found.');
    return;
  }

  for (const user of users) {
    console.log(`Found User: ID=${user.id}, Name=${user.firstName} ${user.lastName}, Role=${user.role}`);
    
    const personal = await db.select().from(pdsPersonalInformation).where(eq(pdsPersonalInformation.employeeId, user.id));
    if (personal.length > 0) {
      console.log(`GSIS Number: ${personal[0].gsisNumber}`);
    } else {
      console.log('No PDS Personal Info found.');
    }

    const hrDetails = await db.select().from(pdsHrDetails).where(eq(pdsHrDetails.employeeId, user.id));
    if (hrDetails.length > 0) {
      console.log(`Job Title: ${hrDetails[0].jobTitle}`);
      console.log(`Position Title: ${hrDetails[0].positionTitle}`);
      console.log(`Department ID: ${hrDetails[0].departmentId}`);
    } else {
      console.log('No HR Details found.');
    }
    console.log('-----------------------------------');
  }
}

main().catch(console.error);
