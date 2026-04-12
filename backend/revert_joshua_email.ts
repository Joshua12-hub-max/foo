import { db } from './db/index.js';
import { authentication } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function revertEmail() {
  const oldEmail = 'joshuapalero111+old@gmail.com';
  const primaryEmail = 'joshuapalero111@gmail.com';
  
  console.log(`--- REVERTING PRIMARY EMAIL ---`);
  console.log(`Target: ${oldEmail} -> ${primaryEmail}`);

  const users = await db.select().from(authentication).where(eq(authentication.id, 15));
  
  if (users.length === 0) {
    console.log("User ID 15 not found.");
    process.exit(0);
  }

  await db.update(authentication)
    .set({ email: primaryEmail })
    .where(eq(authentication.id, 15));
    
  console.log(`Updated user ID: 15 to ${primaryEmail}`);
  console.log("Primary email restored 100%.");
  process.exit(0);
}

revertEmail().catch(console.error);
