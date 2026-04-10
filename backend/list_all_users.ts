import { db } from './db/index.js';
import { authentication } from './db/schema.js';

async function listUsers() {
  console.log('--- ALL AUTHENTICATION USERS ---');
  const all = await db.select().from(authentication);
  console.log(`Total users: ${all.length}`);
  all.forEach(u => {
    console.log(`- ID: ${u.id}, EmpID: ${u.employeeId}, Email: ${u.email}, Role: ${u.role}`);
  });
  process.exit(0);
}

listUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
