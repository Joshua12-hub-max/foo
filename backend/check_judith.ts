import 'dotenv/config';
import { db } from './db/index.js';
import { authentication } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const user = await db.query.authentication.findFirst({
      where: eq(authentication.email, 'capstone682@gmail.com')
    });
    console.log('User Record:', JSON.stringify(user, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
