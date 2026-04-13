import { db } from '../db/index.js';
import { authentication } from '../db/schema.js';
import { or, like, and } from 'drizzle-orm';

async function identifyUsers() {
  console.log('Searching for users...');
  
  const users = await db.select({
    id: authentication.id,
    firstName: authentication.firstName,
    lastName: authentication.lastName,
    employeeId: authentication.employeeId,
    role: authentication.role,
    email: authentication.email
  })
  .from(authentication)
  .where(or(
    and(like(authentication.firstName, '%Christian%'), like(authentication.lastName, '%Ramos%')),
    and(like(authentication.firstName, '%Ron%'), like(authentication.lastName, '%Cruz%'))
  ));

  if (users.length === 0) {
    console.log('No users found matching the criteria.');
  } else {
    console.log('Found users:');
    users.forEach(u => {
      console.log(`- ID: ${u.id}, EmployeeID: ${u.employeeId}, Name: ${u.firstName} ${u.lastName}, Email: ${u.email}, Role: ${u.role}`);
    });
  }
  
  process.exit(0);
}

identifyUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
