import { db } from '../db/index.js';
import { authentication } from '../db/schema.js';
import { sql, like } from 'drizzle-orm';

async function findSofia() {
  try {
    console.log('Searching for "Sofia" in authentication table...');
    const sofias = await db.select()
      .from(authentication)
      .where(or(
        like(authentication.firstName, '%Sofia%'),
        like(authentication.lastName, '%Sofia%')
      ));

    console.log('Sofia records found:', sofias.map(r => ({ id: r.id, employeeId: r.employeeId, firstName: r.firstName, lastName: r.lastName, email: r.email, role: r.role })));
  } catch (error) {
    console.error('Error finding Sofia:', error);
  }
}

import { or } from 'drizzle-orm';
findSofia();
