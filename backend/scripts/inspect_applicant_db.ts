import { db } from '../db/index.js';
import { recruitmentApplicants } from '../db/tables/recruitment.js';
import { eq } from 'drizzle-orm';
import fs from 'fs';

async function inspect() {
  try {
    const results = await db.select().from(recruitmentApplicants).where(eq(recruitmentApplicants.stage, 'Hired'));
    
    fs.writeFileSync('inspect_hired_result.json', JSON.stringify(results, null, 2));
    console.log('Results written to inspect_hired_result.json');
    console.log('Hired Applicants:', results.map(a => ({ name: `${a.firstName} ${a.lastName}`, jobId: a.jobId, stage: a.stage })));
  } catch (error) {
    console.error('Error during inspection:', error);
  }
  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
