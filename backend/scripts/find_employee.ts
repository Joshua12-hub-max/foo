import { db } from '../db/index.js';
import { authentication } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function findEmployee() {
  const employeeId = '2021-00100';
  console.log(`Searching for employee with ID: ${employeeId}`);

  try {
    const results = await db.select().from(authentication).where(eq(authentication.employeeId, employeeId));
    
    if (results.length === 0) {
      console.log(`No employee found with ID: ${employeeId}`);
    } else {
      console.log('Employee found:');
      console.log(JSON.stringify(results, null, 2));
    }
  } catch (error) {
    console.error('Error searching for employee:', error);
  }

  process.exit(0);
}

findEmployee().catch(err => {
  console.error(err);
  process.exit(1);
});
