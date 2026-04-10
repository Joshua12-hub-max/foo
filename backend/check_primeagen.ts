import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function check() {
  console.log('--- CHECKING AUTHENTICATION TABLE FOR primeagen5@gmail.com ---');
  try {
    const res = await db.execute(sql`SELECT * FROM authentication WHERE email = 'primeagen5@gmail.com'`);
    console.log('Results:', JSON.stringify(res[0], null, 2));
    
    if (res[0].length === 0) {
      console.log('No user found in authentication table with that email.');
    } else {
      console.log('USER FOUND in authentication table!');
    }
  } catch (err) {
    console.error('Error querying database:', err);
  }
  process.exit(0);
}
check();
