import { db } from '../db/index.js';
import { recruitmentApplicants } from '../db/schema.js';

async function listApplicants() {
  console.log('Listing all applicants...');
  try {
    const results = await db.select({
      id: recruitmentApplicants.id,
      firstName: recruitmentApplicants.firstName,
      lastName: recruitmentApplicants.lastName,
      email: recruitmentApplicants.email,
      isRegistered: recruitmentApplicants.isRegistered,
      registeredEmployeeId: recruitmentApplicants.registeredEmployeeId
    }).from(recruitmentApplicants);
    console.log('--- APPLICANTS ---');
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Error listing applicants:', error);
  }
  process.exit(0);
}

listApplicants();
