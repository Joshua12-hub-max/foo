
import { db } from '../db/index.js';
import { authentication } from '../db/schema.js';
import { eq, like } from 'drizzle-orm';

async function verifyCHRMO() {
  console.log('Verifying CHRMO Employees...');
  const users = await db.select({
      name: authentication.firstName,
      lastName: authentication.lastName,
      email: authentication.email,
      role: authentication.role,
      department: authentication.department,
      empId: authentication.employeeId,
      jobTitle: authentication.jobTitle
  }).from(authentication)
  .where(like(authentication.department, '%Human Resources%'));

  console.table(users);
  console.log(`Total CHRMO employees: ${users.length}`);
  process.exit(0);
}

verifyCHRMO();
