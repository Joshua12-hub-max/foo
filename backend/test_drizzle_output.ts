import { db } from './db/index.js';
import { pdsPersonalInformation } from './db/tables/pds.js';
import { eq } from 'drizzle-orm';

async function main() {
  const userId = 18; // Allen Camacho
  const rows = await db.select().from(pdsPersonalInformation).where(eq(pdsPersonalInformation.employeeId, userId));
  
  console.log('Drizzle output for Allen Camacho:');
  console.log(JSON.stringify(rows[0], null, 2));
}

main().catch(console.error);
