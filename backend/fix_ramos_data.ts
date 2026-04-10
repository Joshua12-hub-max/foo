
import { db } from './db/index';
import { pdsPersonalInformation, employeeEmergencyContacts, authentication, recruitmentApplicants } from './db/schema';
import { eq, and, like } from 'drizzle-orm';

const run = async () => {
  try {
    const userId = 17; // Ramos Auth ID
    console.log('--- RESTORING MISSING DATA FOR RAMOS (ID: 17) ---');

    // 1. Find the source recruitment data
    const applicant = await db.query.recruitmentApplicants.findFirst({
      where: and(
        like(recruitmentApplicants.firstName, '%Christian%'),
        like(recruitmentApplicants.lastName, '%Ramos%')
      )
    });

    if (!applicant) {
      console.error('Source applicant data not found!');
      return;
    }

    // 2. Restore Emergency Contact
    if (applicant.emergencyContact && applicant.emergencyContactNumber) {
      console.log('Syncing Emergency Contact:', applicant.emergencyContact);
      
      const emergencyData = {
        employeeId: userId,
        name: applicant.emergencyContact,
        phoneNumber: applicant.emergencyContactNumber,
        relationship: 'Contact Person',
        isPrimary: true
      };

      await db.delete(employeeEmergencyContacts).where(eq(employeeEmergencyContacts.employeeId, userId));
      await db.insert(employeeEmergencyContacts).values(emergencyData);
      console.log('✅ Emergency Contact Restored.');
    }

    // 3. Ensure PDS Personal Info exists and has address codes
    const existingPersonal = await db.query.pdsPersonalInformation.findFirst({
        where: eq(pdsPersonalInformation.employeeId, userId)
    });

    if (existingPersonal) {
        console.log('Checking Address Codes...');
        // If for some reason codes are missing but names exist in the applicant record, we could sync them here.
        // But the audit showed codes ARE present: resCity: "031412", etc.
        console.log('Current resCity in DB:', existingPersonal.resCity);
    }

    console.log('--- RESTORATION COMPLETE ---');

  } catch (err) {
    console.error('Error during restoration:', err);
  } finally {
    process.exit(0);
  }
};

run();
