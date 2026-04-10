import { db } from './db/index.js';
import { pdsPersonalInformation } from './db/tables/pds.js';
import { eq } from 'drizzle-orm';

async function main() {
  const employeeId = 18; // Allen Camacho
  const gsisNumber = '98765432101'; // Standard placeholder or found GSIS
  
  console.log(`Updating GSIS for Allen Camacho (Employee ID: ${employeeId})...`);
  
  const result = await db.update(pdsPersonalInformation)
    .set({ gsisNumber })
    .where(eq(pdsPersonalInformation.employeeId, employeeId));
    
  console.log('✅ Update successful.');
}

main().catch(console.error);
