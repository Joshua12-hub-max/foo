import { db } from '../db/index.js';
import { authentication } from '../db/schema.js';
import { sql, like, or } from 'drizzle-orm';

async function findJG() {
  try {
    const results = await db.select()
      .from(authentication)
      .where(or(
        like(authentication.firstName, '%JG%'),
        like(authentication.lastName, '%JG%'),
        like(authentication.firstName, '%Joshua%'),
        like(authentication.lastName, '%Garcia%')
      ));

    console.log('Records matching JG, Joshua, or Garcia:', results.map(r => ({ 
      id: r.id, 
      employeeId: r.employeeId, 
      firstName: r.firstName, 
      lastName: r.lastName, 
      email: r.email 
    })));
  } catch (error) {
    console.error('Error finding JG:', error);
  }
}

findJG();
