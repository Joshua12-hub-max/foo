import pool from '../db/index.js';
import { db } from '../db/index.js';
import { recruitmentApplicants, recruitmentJobs } from '../db/tables/recruitment.js';
import { authentication as users } from '../db/tables/auth.js';
import { eq, and, or, inArray, isNull, isNotNull } from 'drizzle-orm';

async function testControllerLogic(duty: string) {
  try {
    console.log(`Testing duty: ${duty}`);
    
    // Normalize duty input (MATCH CONTROLLER LOGIC)
    const normalizedDuty = (duty === 'Irregular Duties' || duty === 'Irregular') ? 'Irregular' : duty;

    // 1. Define target types
    const standardTypes = ['Permanent', 'Full-time', 'Temporary', 'Probationary'] as const;
    const irregularTypes = ['Job Order', 'Contractual', 'Casual', 'Coterminous', 'Part-time', 'Contract of Service', 'JO', 'COS'] as const;

    const targetTypes = (normalizedDuty === 'Standard' ? [...standardTypes] : [...irregularTypes]);

    // 2. Perform main query
    const results = await db.select({
      applicant: recruitmentApplicants,
      job: recruitmentJobs
    })
    .from(recruitmentApplicants)
    .innerJoin(recruitmentJobs, eq(recruitmentApplicants.jobId, recruitmentJobs.id))
    .where(
      and(
        eq(recruitmentApplicants.isConfirmed, true),
        eq(recruitmentApplicants.stage, 'Rejected'),
        or(
          inArray(recruitmentJobs.employmentType, targetTypes as never),
          eq(recruitmentJobs.dutyType, normalizedDuty as never)
        )
      )
    );

    console.log(`Query returned ${results.length} results.`);

    // 3. Filter using refined logic (MATCH CONTROLLER LOGIC)
    const filteredApplicants = results
      .filter(row => !row.applicant.registeredEmployeeId)
      .map(row => ({
        id: row.applicant.id,
        firstName: row.applicant.firstName,
        lastName: row.applicant.lastName,
        email: row.applicant.email,
        registeredEmployeeId: row.applicant.registeredEmployeeId
      }));

    console.log('--- Filtered Applicants (Expected Frontend Data) ---');
    console.log(JSON.stringify(filteredApplicants, null, 2));

  } catch (err) {
    console.error('SIMULATION FAILED:');
    console.error(err);
  } finally {
    process.exit(0);
  }
}

testControllerLogic('Standard');
