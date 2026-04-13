import { db } from '../db/index.js';
import { authentication } from '../db/schema.js';
import { sql } from 'drizzle-orm';

async function checkDuplicates() {
  try {
    console.log('Checking for duplicate names in authentication table...');
    const duplicates = await db.select({
      firstName: authentication.firstName,
      lastName: authentication.lastName,
      middleName: authentication.middleName,
      count: sql<number>`count(*)`
    })
    .from(authentication)
    .groupBy(authentication.firstName, authentication.lastName, authentication.middleName)
    .having(sql`count(*) > 1`);

    console.log('Duplicate names found:', duplicates);

    if (duplicates.length > 0) {
      for (const dup of duplicates) {
        const records = await db.select()
          .from(authentication)
          .where(sql`${authentication.firstName} = ${dup.firstName} AND ${authentication.lastName} = ${dup.lastName} AND (${authentication.middleName} = ${dup.middleName} OR (${authentication.middleName} IS NULL AND ${dup.middleName} IS NULL))`);
        
        console.log(`Records for ${dup.firstName} ${dup.lastName}:`, records.map(r => ({ id: r.id, employeeId: r.employeeId, email: r.email, role: r.role })));
      }
    } else {
      console.log('No duplicate names found.');
    }
  } catch (error) {
    console.error('Error checking duplicates:', error);
  }
}

checkDuplicates();
