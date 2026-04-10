import { db } from './db/index.js';
import { authentication } from './db/tables/auth.js';

async function listAllAuth() {
  try {
    const users = await db.select({
      id: authentication.id,
      employeeId: authentication.employeeId,
      email: authentication.email,
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      role: authentication.role
    }).from(authentication);

    console.log('\n=== All Authentication Records ===');
    console.log(`Total: ${users.length} records\n`);

    users.forEach(u => {
      console.log(`ID: ${u.id} | EmpID: ${u.employeeId || 'N/A'} | Email: ${u.email} | Name: ${u.firstName || ''} ${u.lastName || ''} | Role: ${u.role}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listAllAuth();
