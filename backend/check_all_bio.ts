import { db } from './db/index.js';
import { bioEnrolledUsers } from './db/schema.js';

async function checkAllBio() {
  console.log('--- ALL BIOMETRIC ENROLLED USERS ---');
  const all = await db.select().from(bioEnrolledUsers);
  console.log(`Total enrolled users: ${all.length}`);
  all.forEach(b => {
    console.log(`- ID: ${b.employeeId}, Name: ${b.fullName}, Status: ${b.userStatus}`);
  });
  process.exit(0);
}

checkAllBio().catch(err => {
  console.error(err);
  process.exit(1);
});
