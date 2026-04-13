import { db } from '../db/index.js';
import { recruitmentApplicants } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function findByEmail() {
  console.log('Searching for applicant by email capstone682@gmail.com...');
  try {
    const results = await db.select().from(recruitmentApplicants).where(
      eq(recruitmentApplicants.email, 'capstone682@gmail.com')
    );
    console.log('--- APPLICANT RESULTS ---');
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error finding applicant:', error);
  }
  process.exit(0);
}

findByEmail();
