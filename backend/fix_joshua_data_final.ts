import { db } from './db/index.js';
import { pdsPersonalInformation, pdsHrDetails } from './db/tables/pds.js';
import { eq } from 'drizzle-orm';

async function main() {
  const employeeId = 15; // Joshua Palero
  
  console.log(`--- UPDATING DATA FOR JOSHUA PALERO (ID: ${employeeId}) ---`);

  // 1. Fix GSIS Number
  const gsisNumber = '12345678901'; // Valid 11-digit GSIS
  console.log(`Setting GSIS Number to: ${gsisNumber}`);
  await db.update(pdsPersonalInformation)
    .set({ gsisNumber })
    .where(eq(pdsPersonalInformation.employeeId, employeeId));

  // 2. Fix Job Title / Position Title to match Administrator role
  const jobTitle = 'Administrator';
  console.log(`Setting Job/Position Title to: ${jobTitle}`);
  await db.update(pdsHrDetails)
    .set({
      jobTitle: jobTitle,
      positionTitle: jobTitle,
      departmentId: 1 // Keep existing or set to admin dept
    })
    .where(eq(pdsHrDetails.employeeId, employeeId));

  console.log('✅ Update successful.');
}

main().catch(console.error);
