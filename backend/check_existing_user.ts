import { db } from './db/index.js';
import { authentication } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function checkUser() {
  const email = 'primeagen5@gmail.com'; // Based on previous debug logs
  console.log(`--- CHECKING USER FOR EMAIL: ${email} ---`);

  const users = await db.select().from(authentication).where(eq(authentication.email, email));
  
  console.log(`Found ${users.length} user(s):`);
  users.forEach(u => {
    console.log(`- ID: ${u.id}, EmpID: ${u.employeeId}, Email: ${u.email}, Role: ${u.role}, Verified: ${u.isVerified}`);
  });

  process.exit(0);
}

checkUser().catch(err => {
  console.error(err);
  process.exit(1);
});
