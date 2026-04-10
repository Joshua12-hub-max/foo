
import { db } from './db/index';
import { pdsPersonalInformation, employeeEmergencyContacts, authentication, recruitmentApplicants } from './db/schema';
import { eq, or, and, like } from 'drizzle-orm';

const run = async () => {
  try {
    const userId = 17; // Ramos Auth ID
    console.log('--- DEEP AUDIT FOR RAMOS (Auth ID: 17) ---');

    const auth = await db.query.authentication.findFirst({
        where: eq(authentication.id, userId),
        with: { hrDetails: true }
    });
    console.log('1. AUTHENTICATION TABLE:', JSON.stringify(auth, null, 2));

    const personal = await db.query.pdsPersonalInformation.findFirst({
      where: eq(pdsPersonalInformation.employeeId, userId)
    });
    console.log('2. PDS PERSONAL INFO:', JSON.stringify(personal, null, 2));

    const emergency = await db.query.employeeEmergencyContacts.findMany({
      where: eq(employeeEmergencyContacts.employeeId, userId)
    });
    console.log('3. EMERGENCY CONTACTS:', JSON.stringify(emergency, null, 2));

    // Search by name in recruitment to find the source data
    const applicant = await db.query.recruitmentApplicants.findFirst({
      where: and(
        like(recruitmentApplicants.firstName, '%Christian%'),
        like(recruitmentApplicants.lastName, '%Ramos%')
      )
    });
    console.log('4. RECRUITMENT APPLICANT DATA:', JSON.stringify(applicant, null, 2));

  } catch (err) {
    console.error('Error during deep audit:', err);
  } finally {
    process.exit(0);
  }
};

run();
