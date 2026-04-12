import { db } from './db/index.js';
import { authentication } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function fixConflict() {
  const email = 'joshuapalero111@gmail.com';
  const newEmail = 'joshuapalero111+old@gmail.com';
  
  console.log(`--- RESOLVING EMAIL CONFLICT ---`);
  console.log(`Target: ${email} -> ${newEmail}`);

  const users = await db.select().from(authentication).where(eq(authentication.email, email));
  
  if (users.length === 0) {
    console.log("No conflict found. Email is already available.");
    process.exit(0);
  }

  for (const user of users) {
    await db.update(authentication)
      .set({ email: newEmail })
      .where(eq(authentication.id, user.id));
    console.log(`Updated user ID: ${user.id} (${user.employeeId}) to ${newEmail}`);
  }

  console.log("Conflict resolved 100%.");
  process.exit(0);
}

fixConflict().catch(console.error);
