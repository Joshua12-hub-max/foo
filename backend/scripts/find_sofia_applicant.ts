import { db } from '../db/index.js';
import { recruitmentApplicants } from '../db/schema.js';
import { like, or } from 'drizzle-orm';

async function findSofia() {
  console.log('Searching for Sofia in recruitment_applicants...');
  try {
    const results = await db.select().from(recruitmentApplicants).where(
      or(
        like(recruitmentApplicants.firstName, '%Sofia%'),
        like(recruitmentApplicants.lastName, '%Sofi%')
      )
    );
    console.log('--- APPLICANT RESULTS ---');
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error finding Sofia:', error);
  }
  process.exit(0);
}

findSofia();
