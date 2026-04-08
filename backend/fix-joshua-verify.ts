import { db } from './db/index.js';
import { authentication } from './db/schema.js';
import { sql, eq } from 'drizzle-orm';

async function fixJoshuaAccount() {
  // Find Joshua's account
  const users = await db.select().from(authentication)
    .where(sql`email LIKE '%joshua%' OR first_name LIKE '%joshua%' OR id >= 11`)
    .limit(10);

  console.log('Found users:', JSON.stringify(users, null, 2));

  // Find the most recent one (likely Joshua's)
  if (users.length > 0) {
    const latestUser = users[users.length - 1];
    console.log('\nLatest user:', latestUser);
    console.log('\nCurrent isVerified:', latestUser.isVerified);
    console.log('Current role:', latestUser.role);

    // Update to verified
    await db.update(authentication)
      .set({ isVerified: true })
      .where(eq(authentication.id, latestUser.id));

    console.log(`\n✓ Updated user ID ${latestUser.id} (${latestUser.email}) to isVerified=true`);
  }

  process.exit(0);
}

fixJoshuaAccount().catch(console.error);
