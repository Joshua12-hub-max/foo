import { db } from '../db/index.js';
import { authentication } from '../db/schema.js';

async function listEmployees() {
  console.log('Listing all employees in authentication table:');

  try {
    const results = await db.select({
      id: authentication.id,
      employeeId: authentication.employeeId,
      firstName: authentication.firstName,
      lastName: authentication.lastName
    }).from(authentication);
    
    console.log(`Found ${results.length} employees:`);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error listing employees:', error);
  }

  process.exit(0);
}

listEmployees().catch(err => {
  console.error(err);
  process.exit(1);
});
