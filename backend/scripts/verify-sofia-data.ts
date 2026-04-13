/**
 * Sofia Data Verification Script
 *
 * Verifies that all of Sofia's PDS data exists in the database and is complete.
 * Run this after inserting Sofia's data to ensure everything is ready for frontend testing.
 *
 * Usage: npx tsx backend/scripts/verify-sofia-data.ts
 */

import { db } from '../db/index.js';
import { authentication, pdsHrDetails } from '../db/schema.js';
import {
  pdsPersonalInformation,
  pdsFamily,
  pdsEducation,
  pdsEligibility,
  pdsWorkExperience,
  pdsVoluntaryWork,
  pdsLearningDevelopment,
  pdsOtherInfo,
  pdsReferences,
  pdsDeclarations,
  employeeEmergencyContacts,
} from '../db/tables/pds.js';
import { eq } from 'drizzle-orm';

interface VerificationResult {
  section: string;
  status: 'OK' | 'MISSING' | 'PARTIAL';
  count: number;
  expected: number;
  details?: string;
}

const verifySofiaData = async () => {
  console.log('\n' + '='.repeat(80));
  console.log('SOFIA DATA VERIFICATION REPORT');
  console.log('='.repeat(80) + '\n');

  const results: VerificationResult[] = [];

  try {
    // Find Sofia's record
    const sofia = await db.query.authentication.findFirst({
      where: eq(authentication.employeeId, 'Emp-010'),
    });

    if (!sofia) {
      console.error('❌ Sofia (Emp-001) not found in authentication table!');
      console.log('\nPlease run the SQL script first:');
      console.log('  backend/scripts/insert-sofia-complete-data.sql\n');
      process.exit(1);
    }

    console.log(`✅ Found Sofia: ${sofia.firstName} ${sofia.lastName} (ID: ${sofia.id})`);
    console.log(`   Email: ${sofia.email}`);
    console.log(`   Role: ${sofia.role}\n`);

    const sofiaId = sofia.id;

    // 1. HR Details
    const hrDetails = await db.select().from(pdsHrDetails).where(eq(pdsHrDetails.employeeId, sofiaId));
    results.push({
      section: 'HR Details',
      status: hrDetails.length === 1 ? 'OK' : 'MISSING',
      count: hrDetails.length,
      expected: 1,
      details: hrDetails[0]
        ? `${hrDetails[0].jobTitle} - SG ${hrDetails[0].salaryGrade} Step ${hrDetails[0].stepIncrement}`
        : undefined,
    });

    // 2. Personal Information
    const personalInfo = await db
      .select()
      .from(pdsPersonalInformation)
      .where(eq(pdsPersonalInformation.employeeId, sofiaId));
    results.push({
      section: 'Personal Information',
      status: personalInfo.length === 1 ? 'OK' : 'MISSING',
      count: personalInfo.length,
      expected: 1,
      details: personalInfo[0]
        ? `${personalInfo[0].gender}, ${personalInfo[0].civilStatus}, Born: ${personalInfo[0].birthDate}`
        : undefined,
    });

    // 3. Family Background
    const family = await db.select().from(pdsFamily).where(eq(pdsFamily.employeeId, sofiaId));
    const hasSpouse = family.some((f) => f.relationType === 'Spouse');
    const hasFather = family.some((f) => f.relationType === 'Father');
    const hasMother = family.some((f) => f.relationType === 'Mother');
    const children = family.filter((f) => f.relationType === 'Child');

    results.push({
      section: 'Family Background',
      status: family.length >= 4 ? 'OK' : family.length > 0 ? 'PARTIAL' : 'MISSING',
      count: family.length,
      expected: 4,
      details: `Spouse: ${hasSpouse ? '✓' : '✗'}, Father: ${hasFather ? '✓' : '✗'}, Mother: ${hasMother ? '✓' : '✗'}, Children: ${children.length}`,
    });

    // 4. Education
    const education = await db.select().from(pdsEducation).where(eq(pdsEducation.employeeId, sofiaId));
    results.push({
      section: 'Educational Background',
      status: education.length >= 4 ? 'OK' : education.length > 0 ? 'PARTIAL' : 'MISSING',
      count: education.length,
      expected: 4,
      details: education.map((e) => e.level).join(', '),
    });

    // 5. Eligibility
    const eligibility = await db.select().from(pdsEligibility).where(eq(pdsEligibility.employeeId, sofiaId));
    results.push({
      section: 'Civil Service Eligibility',
      status: eligibility.length >= 2 ? 'OK' : eligibility.length > 0 ? 'PARTIAL' : 'MISSING',
      count: eligibility.length,
      expected: 2,
      details: eligibility.map((e) => e.eligibilityName).join(', '),
    });

    // 6. Work Experience
    const workExp = await db.select().from(pdsWorkExperience).where(eq(pdsWorkExperience.employeeId, sofiaId));
    results.push({
      section: 'Work Experience',
      status: workExp.length >= 3 ? 'OK' : workExp.length > 0 ? 'PARTIAL' : 'MISSING',
      count: workExp.length,
      expected: 3,
      details: workExp.map((w) => w.positionTitle).join(', '),
    });

    // 7. Voluntary Work
    const voluntary = await db.select().from(pdsVoluntaryWork).where(eq(pdsVoluntaryWork.employeeId, sofiaId));
    results.push({
      section: 'Voluntary Work',
      status: voluntary.length >= 2 ? 'OK' : voluntary.length > 0 ? 'PARTIAL' : 'MISSING',
      count: voluntary.length,
      expected: 2,
      details: voluntary.map((v) => v.organizationName).join(', '),
    });

    // 8. Learning & Development
    const learning = await db
      .select()
      .from(pdsLearningDevelopment)
      .where(eq(pdsLearningDevelopment.employeeId, sofiaId));
    results.push({
      section: 'Learning & Development',
      status: learning.length >= 4 ? 'OK' : learning.length > 0 ? 'PARTIAL' : 'MISSING',
      count: learning.length,
      expected: 4,
      details: `${learning.length} training programs`,
    });

    // 9. Other Information
    const otherInfo = await db.select().from(pdsOtherInfo).where(eq(pdsOtherInfo.employeeId, sofiaId));
    const skills = otherInfo.filter((o) => o.type === 'Skill');
    const recognitions = otherInfo.filter((o) => o.type === 'Recognition');
    const memberships = otherInfo.filter((o) => o.type === 'Membership');

    results.push({
      section: 'Other Information',
      status: otherInfo.length >= 7 ? 'OK' : otherInfo.length > 0 ? 'PARTIAL' : 'MISSING',
      count: otherInfo.length,
      expected: 7,
      details: `Skills: ${skills.length}, Recognitions: ${recognitions.length}, Memberships: ${memberships.length}`,
    });

    // 10. References
    const references = await db.select().from(pdsReferences).where(eq(pdsReferences.employeeId, sofiaId));
    results.push({
      section: 'References',
      status: references.length >= 3 ? 'OK' : references.length > 0 ? 'PARTIAL' : 'MISSING',
      count: references.length,
      expected: 3,
      details: references.map((r) => r.name).join(', '),
    });

    // 11. Declarations
    const declarations = await db.select().from(pdsDeclarations).where(eq(pdsDeclarations.employeeId, sofiaId));
    results.push({
      section: 'Declarations',
      status: declarations.length === 1 ? 'OK' : 'MISSING',
      count: declarations.length,
      expected: 1,
    });

    // 12. Emergency Contacts
    const emergency = await db
      .select()
      .from(employeeEmergencyContacts)
      .where(eq(employeeEmergencyContacts.employeeId, sofiaId));
    results.push({
      section: 'Emergency Contacts',
      status: emergency.length >= 2 ? 'OK' : emergency.length > 0 ? 'PARTIAL' : 'MISSING',
      count: emergency.length,
      expected: 2,
      details: emergency.map((e) => e.name).join(', '),
    });

    // Print results
    console.log('='.repeat(80));
    console.log('DATA VERIFICATION RESULTS');
    console.log('='.repeat(80) + '\n');

    let allComplete = true;

    results.forEach((result) => {
      const icon = result.status === 'OK' ? '✅' : result.status === 'PARTIAL' ? '⚠️ ' : '❌';
      const statusText =
        result.status === 'OK'
          ? 'COMPLETE'
          : result.status === 'PARTIAL'
            ? `PARTIAL (${result.count}/${result.expected})`
            : 'MISSING';

      console.log(`${icon} ${result.section.padEnd(30)} ${statusText}`);

      if (result.details) {
        console.log(`   ${result.details}`);
      }

      if (result.status !== 'OK') {
        allComplete = false;
      }
    });

    console.log('\n' + '='.repeat(80));

    if (allComplete) {
      console.log('✅ ALL DATA COMPLETE - Sofia\'s profile is ready for frontend testing!');
      console.log('='.repeat(80) + '\n');
      console.log('Next steps:');
      console.log('1. Start the backend server: npm run dev');
      console.log('2. Start the frontend: npm start');
      console.log('3. Login with: sofia.reyes@meycauayan.gov.ph');
      console.log('4. Navigate to Profile section');
      console.log('5. Verify all sections display correctly\n');
      process.exit(0);
    } else {
      console.log('⚠️  INCOMPLETE DATA - Some sections are missing or partial');
      console.log('='.repeat(80) + '\n');
      console.log('Please run the SQL script to insert complete data:');
      console.log('  backend/scripts/insert-sofia-complete-data.sql\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    process.exit(1);
  }
};

// Run verification
verifySofiaData();
