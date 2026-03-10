import 'dotenv/config';
import { db } from '../db/index.js';
import { authentication } from '../db/schema.js';

async function main() {
  try {
    const users = await db.select().from(authentication);
    console.log(`Total users in DB: ${users.length}`);
    users.forEach(u => console.log(`- ${u.email} (Role: ${u.role})`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
