/**
 * Check Sofia (Emp-010) Current Data
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

const checkSofia = async () => {
  console.log('\n' + '='.repeat(80));
  console.log('SOFIA (Emp-010) CURRENT DATA CHECK');
  console.log('='.repeat(80) + '\n');

  const sofia = await db.query.authentication.findFirst({
    where: eq(authentication.employeeId, 'Emp-010'),
  });

  if (!sofia) {
    console.log('❌ Sofia (Emp-010) not found!');
    return;
  }

  console.log('✅ Found Sofia:');
  console.log(`   Database ID: ${sofia.id}`);
  console.log(`   Employee ID: ${sofia.employeeId}`);
  console.log(`   Name: ${sofia.firstName} ${sofia.middleName} ${sofia.lastName}`);
  console.log(`   Email: ${sofia.email}`);
  console.log(`   Role: ${sofia.role}`);
  console.log(`   Verified: ${sofia.isVerified}\n`);

  const sofiaId = sofia.id;

  // Check each section
  const hrDetails = await db.select().from(pdsHrDetails).where(eq(pdsHrDetails.employeeId, sofiaId));
  const personal = await db.select().from(pdsPersonalInformation).where(eq(pdsPersonalInformation.employeeId, sofiaId));
  const family = await db.select().from(pdsFamily).where(eq(pdsFamily.employeeId, sofiaId));
  const education = await db.select().from(pdsEducation).where(eq(pdsEducation.employeeId, sofiaId));
  const eligibility = await db.select().from(pdsEligibility).where(eq(pdsEligibility.employeeId, sofiaId));
  const workExp = await db.select().from(pdsWorkExperience).where(eq(pdsWorkExperience.employeeId, sofiaId));
  const voluntary = await db.select().from(pdsVoluntaryWork).where(eq(pdsVoluntaryWork.employeeId, sofiaId));
  const learning = await db.select().from(pdsLearningDevelopment).where(eq(pdsLearningDevelopment.employeeId, sofiaId));
  const otherInfo = await db.select().from(pdsOtherInfo).where(eq(pdsOtherInfo.employeeId, sofiaId));
  const references = await db.select().from(pdsReferences).where(eq(pdsReferences.employeeId, sofiaId));
  const declarations = await db.select().from(pdsDeclarations).where(eq(pdsDeclarations.employeeId, sofiaId));
  const emergency = await db.select().from(employeeEmergencyContacts).where(eq(employeeEmergencyContacts.employeeId, sofiaId));

  console.log('CURRENT DATA STATUS:');
  console.log('='.repeat(80));
  console.log(`✅ HR Details:              ${hrDetails.length} record(s)`);
  if (hrDetails[0]) {
    console.log(`   Position: ${hrDetails[0].jobTitle || 'N/A'}`);
    console.log(`   SG: ${hrDetails[0].salaryGrade || 'N/A'}, Step: ${hrDetails[0].stepIncrement || 'N/A'}`);
  }

  console.log(`\n${personal.length > 0 ? '✅' : '❌'} Personal Info:          ${personal.length} record(s)`);
  if (personal[0]) {
    console.log(`   Birth Date: ${personal[0].birthDate || 'N/A'}`);
    console.log(`   Gender: ${personal[0].gender || 'N/A'}`);
    console.log(`   Civil Status: ${personal[0].civilStatus || 'N/A'}`);
    console.log(`   Mobile: ${personal[0].mobileNo || 'N/A'}`);
  }

  console.log(`\n${family.length >= 4 ? '✅' : '⚠️'} Family Background:      ${family.length} record(s) (Expected: 4+)`);
  if (family.length > 0) {
    family.forEach(f => {
      console.log(`   - ${f.relationType}: ${f.firstName} ${f.lastName}`);
    });
  }

  console.log(`\n${education.length >= 4 ? '✅' : '⚠️'} Education:              ${education.length} record(s) (Expected: 4)`);
  if (education.length > 0) {
    education.forEach(e => {
      console.log(`   - ${e.level}: ${e.schoolName} (${e.dateFrom}-${e.dateTo})`);
    });
  }

  console.log(`\n${eligibility.length >= 2 ? '✅' : '⚠️'} Eligibility:            ${eligibility.length} record(s) (Expected: 2+)`);
  console.log(`${workExp.length >= 3 ? '✅' : '⚠️'} Work Experience:        ${workExp.length} record(s) (Expected: 3+)`);
  console.log(`${voluntary.length >= 2 ? '✅' : '⚠️'} Voluntary Work:         ${voluntary.length} record(s) (Expected: 2+)`);
  console.log(`${learning.length >= 4 ? '✅' : '⚠️'} Learning & Dev:         ${learning.length} record(s) (Expected: 4+)`);
  console.log(`${otherInfo.length >= 7 ? '✅' : '⚠️'} Other Info:             ${otherInfo.length} record(s) (Expected: 7+)`);
  console.log(`${references.length >= 3 ? '✅' : '⚠️'} References:             ${references.length} record(s) (Expected: 3)`);
  console.log(`${declarations.length >= 1 ? '✅' : '⚠️'} Declarations:           ${declarations.length} record(s) (Expected: 1)`);
  console.log(`${emergency.length >= 2 ? '✅' : '⚠️'} Emergency Contacts:     ${emergency.length} record(s) (Expected: 2+)`);

  const totalRecords = hrDetails.length + personal.length + family.length + education.length +
    eligibility.length + workExp.length + voluntary.length + learning.length +
    otherInfo.length + references.length + declarations.length + emergency.length;

  console.log('\n' + '='.repeat(80));
  console.log(`Total PDS Records: ${totalRecords}`);

  // Calculate completeness
  const requiredSections = 12;
  const completedSections = [
    hrDetails.length > 0,
    personal.length > 0,
    family.length >= 4,
    education.length >= 4,
    eligibility.length >= 2,
    workExp.length >= 3,
    voluntary.length >= 2,
    learning.length >= 4,
    otherInfo.length >= 7,
    references.length >= 3,
    declarations.length >= 1,
    emergency.length >= 2,
  ].filter(Boolean).length;

  const completeness = Math.round((completedSections / requiredSections) * 100);

  console.log(`Completeness: ${completeness}% (${completedSections}/${requiredSections} sections complete)`);

  if (completeness < 100) {
    console.log('\n⚠️  INCOMPLETE DATA - Sofia\'s profile needs more data');
    console.log('\n📝 SOLUTION:');
    console.log('   I will create a new SQL script to populate Sofia (Emp-010) with complete data.\n');
  } else {
    console.log('\n✅ COMPLETE DATA - All sections populated!');
    console.log('\nIf frontend still not showing, check:');
    console.log('1. Are you logged in as Sofia (Emp-010)?');
    console.log('2. Browser console for errors');
    console.log('3. Network tab - are API calls succeeding?');
    console.log('4. Frontend component rendering logic\n');
  }
};

checkSofia();
