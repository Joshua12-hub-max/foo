import { db } from '../db/index.js';
import { authentication } from '../db/schema.js';
import { sql, like, or } from 'drizzle-orm';

async function findAllSofia() {
  try {
    const sofias = await db.select()
      .from(authentication)
      .where(or(
        like(authentication.firstName, '%Sofia%'),
        like(authentication.lastName, '%Sofia%'),
        like(authentication.firstName, '%Sofi%'),
        like(authentication.lastName, '%Sofi%')
      ));

    console.log('All records matching Sofia or Sofi:', sofias.map(r => ({ 
      id: r.id, 
      employeeId: r.employeeId, 
      firstName: r.firstName, 
      lastName: r.lastName, 
      middleName: r.middleName,
      email: r.email 
    })));
  } catch (error) {
    console.error('Error finding all Sofia:', error);
  }
}

findAllSofia();
