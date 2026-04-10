
import { db } from './db/index';
import { authentication, bioEnrolledUsers } from './db/schema';
import { like, and, eq } from 'drizzle-orm';

const run = async () => {
  try {
    console.log('Searching for Ramos, Christian Paul Aquino...');
    const user = await db.query.authentication.findFirst({
      where: and(
        like(authentication.firstName, '%Christian%'),
        like(authentication.lastName, '%Ramos%')
      )
    });

    if (!user) {
      console.log('User not found in authentication table.');
      return;
    }

    console.log('User found:', JSON.stringify(user, null, 2));

    const enrolled = await db.query.bioEnrolledUsers.findFirst({
      where: eq(bioEnrolledUsers.employeeId, user.employeeId || '')
    });

    if (enrolled) {
      console.log('Biometric enrollment found:', JSON.stringify(enrolled, null, 2));
    } else {
      console.log('No biometric enrollment found for employeeId:', user.employeeId);
      
      const enrolledByName = await db.query.bioEnrolledUsers.findFirst({
        where: like(bioEnrolledUsers.fullName, `%${user.lastName}%`)
      });
      
      if (enrolledByName) {
        console.log('Found biometric record by name mismatch:', JSON.stringify(enrolledByName, null, 2));
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
};

run();
