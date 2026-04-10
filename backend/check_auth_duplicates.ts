import { db } from './db/index.js';
import { authentication } from './db/schema.js';
import { sql } from 'drizzle-orm';

async function check() {
  const res = await db.select({ 
    empId: authentication.employeeId, 
    count: sql<number>`count(*)` 
  }).from(authentication).groupBy(authentication.employeeId).having(sql`count(*) > 1`);
  
  console.log('Duplicates in authentication:', res);
  process.exit(0);
}

check().catch(console.error);
