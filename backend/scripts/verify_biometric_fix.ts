import pool from '../db/index.js';
import { db } from '../db/index.js';
import { authentication, bioEnrolledUsers } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/mysql-core';

async function verifyFix(deptId: number) {
  try {
    console.log(`Verifying fix for Department ID: ${deptId}`);
    
    const auth = alias(authentication, 'auth');
    const employees = await db.select({
      id: auth.id,
      employeeId: auth.employeeId,
      firstName: auth.firstName,
      lastName: auth.lastName,
      isBiometricEnrolled: sql<boolean>`CASE WHEN ${bioEnrolledUsers.employeeId} IS NOT NULL THEN true ELSE false END`
    })
    .from(auth)
    .leftJoin(bioEnrolledUsers, eq(auth.employeeId, bioEnrolledUsers.employeeId))
    .where(eq(auth.departmentId, deptId));

    console.log('--- Employee Biometric Status ---');
    console.log(JSON.stringify(employees, null, 2));

    const enrolledCount = employees.filter(e => e.isBiometricEnrolled).length;
    console.log(`\nVerification Result: ${enrolledCount}/${employees.length} employees have BIO ENROLLED status.`);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

verifyFix(16);
