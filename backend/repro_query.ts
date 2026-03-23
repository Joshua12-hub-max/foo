import { db } from './db/index.js';
import { authentication } from './db/schema.js';
import { eq, or, sql } from 'drizzle-orm';

async function repro() {
  try {
    console.log('Attempting to run the query that failed...');
    const identifier = 'capstone682@gmail.com';
    const lowerIdentifier = identifier.toLowerCase();
    
    const conditions = [];
    conditions.push(eq(authentication.email, identifier));
    conditions.push(sql`LOWER(${authentication.email}) = ${lowerIdentifier}`);
    conditions.push(sql`LOWER(${authentication.employeeId}) = ${lowerIdentifier}`);
    conditions.push(eq(authentication.employeeId, identifier));

    const result = await db.query.authentication.findFirst({
      where: or(...conditions),
      with: {
        department: true,
        plantillaPosition: true,
        pdsEducations: {
          limit: 1,
          orderBy: (edu, { desc }) => [desc(edu.createdAt)]
        }
      }
    });
    
    console.log('Query successful!');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Query failed!');
    console.error('Error message:', error.message);
    if (error.sqlMessage) console.error('SQL Message:', error.sqlMessage);
    if (error.code) console.error('Error Code:', error.code);
    if (error.sql) console.error('Failed SQL:', error.sql);
    if (error.cause) console.error('Cause:', error.cause);
  } finally {
    process.exit(0);
  }
}

repro();
