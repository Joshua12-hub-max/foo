import { db } from './db/index.js';
import { authentication } from './db/tables/auth.js';
import { pdsPersonalInformation } from './db/tables/pds.js';
import { eq, or, like } from 'drizzle-orm';

async function main() {
  console.log('Searching for Allen Camacho...');
  const users = await db.select().from(authentication).where(
    or(
      like(authentication.firstName, '%Allen%'),
      like(authentication.lastName, '%Camacho%')
    )
  );

  if (users.length === 0) {
    console.log('No user found with name "Allen" or "Camacho"');
    return;
  }

  for (const user of users) {
    console.log(`Found User: ID=${user.id}, Name=${user.firstName} ${user.lastName}`);
    
    const pdsData = await db.select().from(pdsPersonalInformation).where(eq(pdsPersonalInformation.employeeId, user.id));
    
    if (pdsData.length === 0) {
      console.log(`No PDS Personal Information found for User ID=${user.id}`);
    } else {
      const p = pdsData[0];
      console.log('PDS Address Values:');
      console.log(`Region: "${p.resRegion}"`);
      console.log(`Province: "${p.resProvince}"`);
      console.log(`City: "${p.resCity}"`);
      console.log(`Barangay: "${p.resBarangay}"`);
      
      console.log('Permanent Address Values:');
      console.log(`Region: "${p.permRegion}"`);
      console.log(`Province: "${p.permProvince}"`);
      console.log(`City: "${p.permCity}"`);
      console.log(`Barangay: "${p.permBarangay}"`);
    }
  }
}

main().catch(console.error);
