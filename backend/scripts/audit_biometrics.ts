import pool from '../db/index.js';
import { db } from '../db/index.js';
import { authentication, bioEnrolledUsers } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function auditBiometrics() {
  try {
    console.log('--- Auditing Authentication Table ---');
    const [users] = await pool.query('SELECT id, employee_id, first_name, last_name, department FROM authentication LIMIT 10');
    console.log(JSON.stringify(users, null, 2));

    console.log('\n--- Auditing Bio Enrolled Users Table ---');
    const [bioUsers] = await pool.query('SELECT * FROM bio_enrolled_users');
    console.log(JSON.stringify(bioUsers, null, 2));

    console.log('\n--- Cross-Check: Employees in Auth but missing in Bio ---');
    const results = await db.select({
        id: authentication.id,
        employeeId: authentication.employeeId,
        firstName: authentication.firstName,
        lastName: authentication.lastName,
        isBioAvailable: bioEnrolledUsers.employeeId
    })
    .from(authentication)
    .leftJoin(bioEnrolledUsers, eq(authentication.employeeId, bioEnrolledUsers.employeeId));

    console.log(JSON.stringify(results.map(r => ({
        ...r,
        status: r.isBioAvailable ? 'BIO ENROLLED' : 'NO BIOMETRICS'
    })), null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

auditBiometrics();
