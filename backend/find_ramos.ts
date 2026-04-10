
import { db } from './db/index';
import { authentication, recruitmentApplicants, bioEnrolledUsers } from './db/schema';
import { like, and, or } from 'drizzle-orm';

const run = async () => {
  try {
    console.log('--- SEARCHING FOR RAMOS, CHRISTIAN PAUL AQUINO ---');
    
    // 1. Search in Authentication (even if user thinks it is deleted)
    const authUser = await db.query.authentication.findFirst({
      where: and(
        like(authentication.firstName, '%Christian%'),
        like(authentication.lastName, '%Ramos%')
      )
    });
    if (authUser) {
      console.log('Found in Authentication table:');
      console.log(`- ID: ${authUser.id}`);
      console.log(`- Employee ID: ${authUser.employeeId}`);
      console.log(`- Email: ${authUser.email}`);
    } else {
      console.log('Not found in Authentication table.');
    }

    // 2. Search in Recruitment Applicants
    const applicant = await db.query.recruitmentApplicants.findFirst({
      where: and(
        like(recruitmentApplicants.firstName, '%Christian%'),
        like(recruitmentApplicants.lastName, '%Ramos%')
      )
    });
    if (applicant) {
      console.log('Found in Recruitment Applicants table:');
      console.log(`- ID: ${applicant.id}`);
      console.log(`- Name: ${applicant.firstName} ${applicant.lastName}`);
      console.log(`- Email: ${applicant.email}`);
      console.log(`- Status: ${applicant.status}`);
    } else {
      console.log('Not found in Recruitment Applicants table.');
    }

    // 3. Search in Biometric Enrolled Users
    const bioUser = await db.query.bioEnrolledUsers.findFirst({
      where: or(
        like(bioEnrolledUsers.fullName, '%Christian%Ramos%'),
        like(bioEnrolledUsers.fullName, '%Ramos%Christian%')
      )
    });
    if (bioUser) {
      console.log('Found in Biometric Enrolled Users table:');
      console.log(`- ID: ${bioUser.id}`);
      console.log(`- Employee ID: ${bioUser.employeeId}`);
      console.log(`- Full Name: ${bioUser.fullName}`);
    } else {
      console.log('Not found in Biometric Enrolled Users table.');
    }

  } catch (err) {
    console.error('Error during search:', err);
  } finally {
    process.exit(0);
  }
};

run();
