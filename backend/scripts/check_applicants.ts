
import { db } from '../db/index.js';
import { recruitmentApplicants } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

async function checkLastHired() {
  console.log('--- Checking Last 5 Hired Applicants ---');
  
  try {
    const applicants = await db.select({
      id: recruitmentApplicants.id,
      firstName: recruitmentApplicants.firstName,
      lastName: recruitmentApplicants.lastName,
      umidNumber: recruitmentApplicants.umidNumber,
      schoolName: recruitmentApplicants.schoolName,
      yearGraduated: recruitmentApplicants.yearGraduated,
      educationalBackground: recruitmentApplicants.educationalBackground,
      gsisNumber: recruitmentApplicants.gsisNumber,
      stage: recruitmentApplicants.stage
    })
    .from(recruitmentApplicants)
    .where(eq(recruitmentApplicants.stage, 'Hired'))
    .orderBy(desc(recruitmentApplicants.id))
    .limit(5);

    console.log(JSON.stringify(applicants, null, 2));
  } catch (error) {
    console.error('Error checking applicants:', error);
  } finally {
    process.exit(0);
  }
}

checkLastHired().catch(console.error);
