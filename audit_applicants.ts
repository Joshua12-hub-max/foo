import { db } from './backend/db/index.js';
import { recruitmentApplicants } from './backend/db/schema.js';
import { eq } from 'drizzle-orm';

async function audit() {
  const applicants = await db.select().from(recruitmentApplicants);
  console.log('--- ALL APPLICANTS ---');
  applicants.forEach(a => {
    console.log(`ID: ${a.id}, Name: ${a.firstName} ${a.lastName}, Stage: [${a.stage}], isConfirmed: ${a.isConfirmed}, startDate: ${a.startDate}`);
  });
  process.exit(0);
}

audit().catch(console.error);
