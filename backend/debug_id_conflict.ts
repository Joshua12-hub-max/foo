import { db } from './db/index.js';
import { authentication, bioEnrolledUsers } from './db/schema.js';
import { eq, or } from 'drizzle-orm';

async function debug() {
  const ids = ['Emp-004', 'Emp-005', '4', '5'];
  console.log('--- DEBUGGING ID CONFLICT ---');

  console.log('\n1. Checking authentication table:');
  const auths = await db.select().from(authentication).where(
    or(...ids.map(id => eq(authentication.employeeId, id)))
  );
  console.log(`Found ${auths.length} record(s) in authentication`);
  auths.forEach(a => console.log(`- ID: ${a.id}, EmpID: ${a.employeeId}, Email: ${a.email}`));

  console.log('\n2. Checking bio_enrolled_users table:');
  const bios = await db.select().from(bioEnrolledUsers).where(
    or(...ids.map(id => eq(bioEnrolledUsers.employeeId, id)))
  );
  console.log(`Found ${bios.length} record(s) in bio_enrolled_users`);
  bios.forEach(b => console.log(`- EmpID: ${b.employeeId}, Name: ${b.fullName}, Status: ${b.userStatus}`));

  process.exit(0);
}
debug();
