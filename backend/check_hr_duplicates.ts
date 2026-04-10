import { db } from './db/index.js';
import { pdsHrDetails } from './db/schema.js';
import { sql } from 'drizzle-orm';

async function check() {
  const res = await db.select({ 
    empId: pdsHrDetails.employeeId, 
    count: sql<number>`count(*)` 
  }).from(pdsHrDetails).groupBy(pdsHrDetails.employeeId).having(sql`count(*) > 1`);
  
  console.log('Duplicates in pdsHrDetails:', res);
  process.exit(0);
}

check().catch(console.error);
