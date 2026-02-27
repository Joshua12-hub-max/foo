import { db } from '../db/index.js';
import { 
  authentication, 
  attendanceLogs, 
  dailyTimeRecords, 
  bioEnrolledUsers 
} from '../db/schema.js';
import { eq } from 'drizzle-orm';

const TEST_EMP_EMAIL = 'test.employee@cityhall.gov.ph';
const TEST_EMP_ID = 'CHRMO-999'; 
const TEST_BIO_ID = 9999;

async function removeTestEmployee() {
  console.log('Removing Test Employee and all associated records...');

  try {
      // 1. Remove DTRs
      console.log('Removing Daily Time Records...');
      await db.delete(dailyTimeRecords).where(eq(dailyTimeRecords.employeeId, TEST_EMP_ID));

      // 2. Remove Attendance Logs
      console.log('Removing Attendance Logs...');
      await db.delete(attendanceLogs).where(eq(attendanceLogs.employeeId, TEST_EMP_ID));

      // 3. Remove Biometrics Enrollment
      console.log('Removing Biometric Enrollment...');
      await db.delete(bioEnrolledUsers).where(eq(bioEnrolledUsers.employeeId, TEST_BIO_ID));

      // 4. Remove Authentication record
      console.log('Removing Authentication Record...');
      await db.delete(authentication).where(eq(authentication.email, TEST_EMP_EMAIL));
      await db.delete(authentication).where(eq(authentication.employeeId, TEST_EMP_ID));

      console.log('✅ Successfully removed all test user data.');
  } catch (error) {
      console.error('❌ Failed to remove test user data:', error);
  }

  process.exit(0);
}

removeTestEmployee();
