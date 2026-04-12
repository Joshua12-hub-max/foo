import { db } from './db/index.js';
import { authentication, recruitmentApplicants, pdsPersonalInformation } from './db/schema.js';
import { eq, or, sql } from 'drizzle-orm';

async function audit() {
  const email = 'joshuapalero111@gmail.com';
  console.log(`--- AUDITING EMAIL: ${email} ---`);

  const auths = await db.select().from(authentication).where(eq(authentication.email, email));
  console.log(`Found ${auths.length} in authentication:`);
  auths.forEach(u => console.log(`- ID: ${u.id}, EmpID: ${u.employeeId}, Role: ${u.role}, Verified: ${u.isVerified}`));

  const applicants = await db.select().from(recruitmentApplicants).where(eq(recruitmentApplicants.email, email));
  console.log(`Found ${applicants.length} in recruitment_applicants:`);
  applicants.forEach(a => console.log(`- ID: ${a.id}, Stage: ${a.stage}, Registered: ${a.isRegistered}`));

  const pds = await db.select().from(pdsPersonalInformation).where(
    sql`LOWER(${pdsPersonalInformation.gsisNumber}) = 'joshuapalero111@gmail.com' OR LOWER(${pdsPersonalInformation.pagibigNumber}) = 'joshuapalero111@gmail.com'`
  );
  console.log(`Found ${pds.length} in pds_personal_information (via email columns if mis-mapped):`);

  process.exit(0);
}

audit().catch(console.error);
