import { db } from './db/index.js';
import { authentication } from './db/tables/auth.js';
import { pdsHrDetails } from './db/tables/pds.js';
import { eq } from 'drizzle-orm';

async function deleteEmp004() {
  try {
    // Find the user
    const user = await db.query.authentication.findFirst({
      where: eq(authentication.employeeId, 'Emp-004')
    });

    if (!user) {
      console.log('Emp-004 not found');
      process.exit(0);
    }

    console.log(`\nFound Emp-004:`);
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Name: ${user.firstName || '(empty)'} ${user.lastName || '(empty)'}`);

    // Delete HR details first (foreign key constraint)
    await db.delete(pdsHrDetails).where(eq(pdsHrDetails.employeeId, user.id));
    console.log('✓ Deleted HR details');

    // Delete authentication record
    await db.delete(authentication).where(eq(authentication.id, user.id));
    console.log('✓ Deleted authentication record');

    console.log('\n✅ Emp-004 successfully deleted. You can now register Ron Cruz with Emp-004.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteEmp004();
