import { db } from './db/index.js';
import { authentication } from './db/tables/auth.js';
import { like, or, eq } from 'drizzle-orm';

async function checkRonCruz() {
  try {
    const users = await db.select().from(authentication).where(
      or(
        like(authentication.firstName, '%Ron%'),
        like(authentication.lastName, '%Cruz%'),
        eq(authentication.employeeId, 'Emp-004'),
        eq(authentication.employeeId, 'Emp-005')
      )
    );

    console.log('\n=== Ron Cruz or Emp-004/Emp-005 users ===');
    console.log(`Found ${users.length} matching records:`);
    users.forEach(user => {
      console.log(`\nID: ${user.id}`);
      console.log(`Employee ID: ${user.employeeId}`);
      console.log(`Name: ${user.firstName} ${user.lastName}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRonCruz();
