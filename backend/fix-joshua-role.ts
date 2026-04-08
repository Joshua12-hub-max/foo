import { db } from './db/index.js';
import { authentication } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function fixJoshuaRole() {
  const email = 'joshuapalero111@gmail.com';

  // Update Joshua's account
  await db.update(authentication)
    .set({
      role: 'Administrator',
      isVerified: true
    })
    .where(eq(authentication.email, email));

  console.log(`✓ Updated Joshua's account:`);
  console.log('  - role: Administrator');
  console.log('  - isVerified: true');

  // Verify the update
  const user = await db.query.authentication.findFirst({
    where: eq(authentication.email, email)
  });

  console.log('\nCurrent status:');
  console.log('  Email:', user?.email);
  console.log('  Role:', user?.role);
  console.log('  IsVerified:', user?.isVerified);

  process.exit(0);
}

fixJoshuaRole().catch(console.error);
