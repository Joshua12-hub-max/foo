import { db } from './db/index.js';
import { pdsPersonalInformation } from './db/tables/pds.js';
import { eq } from 'drizzle-orm';

console.log('Testing Drizzle query...\n');

try {
  const rows = await db.select()
    .from(pdsPersonalInformation)
    .where(eq(pdsPersonalInformation.employeeId, 3))
    .limit(1);
  
  console.log('✅ Success! Rows:', rows.length);
  if (rows[0]) {
    console.log('Data:', JSON.stringify(rows[0], null, 2));
  }
} catch (err) {
  console.log('❌ Error:', err);
  console.log('Error name:', err.name);
  console.log('Error message:', err.message);
  console.log('Error stack:', err.stack);
  if (err.cause) console.log('Error cause:', err.cause);
}

process.exit(0);
