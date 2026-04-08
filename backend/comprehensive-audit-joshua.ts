import { db } from './db/index.js';
import { authentication } from './db/schema.js';
import {
  pdsPersonalInformation,
  pdsHrDetails,
  pdsDeclarations,
  pdsFamily,
  pdsEducation,
  pdsEligibility,
  pdsWorkExperience,
  pdsLearningDevelopment,
  pdsVoluntaryWork,
  pdsReferences,
  pdsOtherInfo,
  employeeEmergencyContacts
} from './db/tables/pds.js';
import { eq } from 'drizzle-orm';

async function comprehensiveAudit() {
  console.log('='.repeat(100));
  console.log('COMPREHENSIVE PROFILE AUDIT FOR JOSHUA - 100% FIELD CHECK');
  console.log('='.repeat(100));

  // Find Joshua's account
  const user = await db.query.authentication.findFirst({
    where: eq(authentication.email, 'joshuapalero111@gmail.com')
  });

  if (!user) {
    console.log('❌ User not found!');
    process.exit(1);
  }

  console.log(`\n✓ User: ${user.firstName} ${user.middleName} ${user.lastName} (ID: ${user.id}, Employee ID: ${user.employeeId})`);
  console.log('='.repeat(100));

  let totalMissing = 0;
  let totalPresent = 0;

  // ============================================================================
  // 1. PERSONAL INFORMATION
  // ============================================================================
  console.log('\n\n📋 SECTION 1: PERSONAL INFORMATION (pds_personal_information)');
  console.log('-'.repeat(100));

  const personalInfo = await db.select()
    .from(pdsPersonalInformation)
    .where(eq(pdsPersonalInformation.employeeId, user.id))
    .limit(1);

  if (personalInfo.length === 0) {
    console.log('❌ NO PERSONAL INFORMATION RECORD EXISTS!');
    totalMissing += 36; // Total fields in personal info
  } else {
    const pds = personalInfo[0];

    const personalFields = [
      { category: 'Personal Details', fields: [
        { name: 'Birth Date', value: pds.birthDate, required: true },
        { name: 'Place of Birth', value: pds.placeOfBirth, required: true },
        { name: 'Sex at Birth / Gender', value: pds.gender, required: true },
        { name: 'Civil Status', value: pds.civilStatus, required: true },
        { name: 'Height (meters)', value: pds.heightM, required: false },
        { name: 'Weight (kg)', value: pds.weightKg, required: false },
        { name: 'Blood Type', value: pds.bloodType, required: true },
        { name: 'Citizenship', value: pds.citizenship, required: true },
        { name: 'Citizenship Type', value: pds.citizenshipType, required: false },
        { name: 'Dual Country', value: pds.dualCountry, required: false },
      ]},
      { category: 'Contact Information', fields: [
        { name: 'Telephone No.', value: pds.telephoneNo, required: false },
        { name: 'Mobile No.', value: pds.mobileNo, required: true },
      ]},
      { category: 'Government IDs', fields: [
        { name: 'GSIS ID Number', value: pds.gsisNumber, required: true },
        { name: 'PAG-IBIG ID Number', value: pds.pagibigNumber, required: true },
        { name: 'PhilHealth Number', value: pds.philhealthNumber, required: true },
        { name: 'TIN Number', value: pds.tinNumber, required: true },
        { name: 'UMID Number', value: pds.umidNumber, required: false },
        { name: 'PhilSys ID', value: pds.philsysId, required: true },
        { name: 'Agency Employee No.', value: pds.agencyEmployeeNo, required: false },
      ]},
      { category: 'Residential Address', fields: [
        { name: 'Res. House/Block/Lot', value: pds.resHouseBlockLot, required: false },
        { name: 'Res. Street', value: pds.resStreet, required: false },
        { name: 'Res. Subdivision', value: pds.resSubdivision, required: false },
        { name: 'Res. Barangay', value: pds.resBarangay, required: true },
        { name: 'Res. City/Municipality', value: pds.resCity, required: true },
        { name: 'Res. Province', value: pds.resProvince, required: true },
        { name: 'Res. Region', value: pds.resRegion, required: true },
        { name: 'Res. Zip Code', value: pds.residentialZipCode, required: true },
      ]},
      { category: 'Permanent Address', fields: [
        { name: 'Perm. House/Block/Lot', value: pds.permHouseBlockLot, required: false },
        { name: 'Perm. Street', value: pds.permStreet, required: false },
        { name: 'Perm. Subdivision', value: pds.permSubdivision, required: false },
        { name: 'Perm. Barangay', value: pds.permBarangay, required: true },
        { name: 'Perm. City/Municipality', value: pds.permCity, required: true },
        { name: 'Perm. Province', value: pds.permProvince, required: true },
        { name: 'Perm. Region', value: pds.permRegion, required: true },
        { name: 'Perm. Zip Code', value: pds.permanentZipCode, required: true },
      ]},
    ];

    personalFields.forEach(category => {
      console.log(`\n  ${category.category}:`);
      category.fields.forEach(field => {
        const status = field.value ? '✓' : '❌';
        const req = field.required ? '[REQUIRED]' : '[OPTIONAL]';
        const displayValue = field.value || '(missing)';
        console.log(`    ${status} ${field.name.padEnd(30)} ${req.padEnd(12)}: ${displayValue}`);
        if (field.value) totalPresent++; else totalMissing++;
      });
    });
  }

  // ============================================================================
  // 2. HR DETAILS
  // ============================================================================
  console.log('\n\n💼 SECTION 2: HR DETAILS (pds_hr_details)');
  console.log('-'.repeat(100));

  const hrDetails = await db.select()
    .from(pdsHrDetails)
    .where(eq(pdsHrDetails.employeeId, user.id))
    .limit(1);

  if (hrDetails.length === 0) {
    console.log('❌ NO HR DETAILS RECORD EXISTS!');
    totalMissing += 26; // Total fields in HR details
  } else {
    const hr = hrDetails[0];

    const hrFields = [
      { category: 'Employment Status', fields: [
        { name: 'Employment Status', value: hr.employmentStatus, required: true },
        { name: 'Appointment Type', value: hr.appointmentType, required: true },
      ]},
      { category: 'Job Assignment', fields: [
        { name: 'Job Title', value: hr.jobTitle, required: true },
        { name: 'Position Title', value: hr.positionTitle, required: true },
        { name: 'Item Number', value: hr.itemNumber, required: false },
        { name: 'Station', value: hr.station, required: false },
        { name: 'Office Address', value: hr.officeAddress, required: false },
        { name: 'Department ID', value: hr.departmentId, required: true },
        { name: 'Position ID', value: hr.positionId, required: false },
        { name: 'Manager ID', value: hr.managerId, required: false },
      ]},
      { category: 'Salary & Rank', fields: [
        { name: 'Salary Grade', value: hr.salaryGrade, required: true },
        { name: 'Step Increment', value: hr.stepIncrement, required: true },
        { name: 'Salary Basis', value: hr.salaryBasis, required: true },
      ]},
      { category: 'Important Dates', fields: [
        { name: 'Date Hired', value: hr.dateHired, required: true },
        { name: 'Contract End Date', value: hr.contractEndDate, required: false },
        { name: 'Regularization Date', value: hr.regularizationDate, required: false },
        { name: 'First Day of Service', value: hr.firstDayOfService, required: true },
        { name: 'Original Appointment Date', value: hr.originalAppointmentDate, required: false },
        { name: 'Last Promotion Date', value: hr.lastPromotionDate, required: false },
      ]},
      { category: 'Shift & Schedule', fields: [
        { name: 'Duty Type', value: hr.dutyType, required: true },
        { name: 'Daily Target Hours', value: hr.dailyTargetHours, required: true },
        { name: 'Start Time', value: hr.startTime, required: false },
        { name: 'End Time', value: hr.endTime, required: false },
      ]},
      { category: 'Profile Metadata', fields: [
        { name: 'Is Regular', value: hr.isRegular, required: false },
        { name: 'Is Old Employee', value: hr.isOldEmployee, required: false },
        { name: 'Is Meycauayan', value: hr.isMeycauayan, required: false },
        { name: 'Profile Status', value: hr.profileStatus, required: true },
      ]},
    ];

    hrFields.forEach(category => {
      console.log(`\n  ${category.category}:`);
      category.fields.forEach(field => {
        const status = field.value !== null && field.value !== undefined ? '✓' : '❌';
        const req = field.required ? '[REQUIRED]' : '[OPTIONAL]';
        const displayValue = field.value !== null && field.value !== undefined ? field.value : '(missing)';
        console.log(`    ${status} ${field.name.padEnd(30)} ${req.padEnd(12)}: ${displayValue}`);
        if (field.value !== null && field.value !== undefined) totalPresent++; else totalMissing++;
      });
    });
  }

  // ============================================================================
  // 3. DECLARATIONS
  // ============================================================================
  console.log('\n\n📝 SECTION 3: DECLARATIONS (pds_declarations)');
  console.log('-'.repeat(100));

  const declarations = await db.select()
    .from(pdsDeclarations)
    .where(eq(pdsDeclarations.employeeId, user.id))
    .limit(1);

  if (declarations.length === 0) {
    console.log('❌ NO DECLARATIONS RECORD EXISTS!');
    totalMissing += 29; // Total fields in declarations
  } else {
    const decl = declarations[0];

    const declFields = [
      { name: 'Q34a: Related to 3rd Degree', value: decl.relatedThirdDegree, required: true },
      { name: 'Q34a: Details', value: decl.relatedThirdDetails, required: false },
      { name: 'Q34b: Related to 4th Degree', value: decl.relatedFourthDegree, required: true },
      { name: 'Q34b: Details', value: decl.relatedFourthDetails, required: false },
      { name: 'Q35: Found Guilty (Admin)', value: decl.foundGuiltyAdmin, required: true },
      { name: 'Q35: Details', value: decl.foundGuiltyDetails, required: false },
      { name: 'Q36: Criminally Charged', value: decl.criminallyCharged, required: true },
      { name: 'Q36: Date Filed', value: decl.dateFiled, required: false },
      { name: 'Q36: Status of Case', value: decl.statusOfCase, required: false },
      { name: 'Q37: Convicted of Crime', value: decl.convictedCrime, required: true },
      { name: 'Q37: Details', value: decl.convictedDetails, required: false },
      { name: 'Q38: Separated from Service', value: decl.separatedFromService, required: true },
      { name: 'Q38: Details', value: decl.separatedDetails, required: false },
      { name: 'Q39a: Election Candidate', value: decl.electionCandidate, required: true },
      { name: 'Q39a: Details', value: decl.electionDetails, required: false },
      { name: 'Q39b: Resigned to Promote', value: decl.resignedToPromote, required: true },
      { name: 'Q39b: Details', value: decl.resignedDetails, required: false },
      { name: 'Q40a: Immigrant Status', value: decl.immigrantStatus, required: true },
      { name: 'Q40a: Details', value: decl.immigrantDetails, required: false },
      { name: 'Q40b: Indigenous Member', value: decl.indigenousMember, required: true },
      { name: 'Q40b: Details', value: decl.indigenousDetails, required: false },
      { name: 'Q40c: Person with Disability', value: decl.personWithDisability, required: true },
      { name: 'Q40c: Disability ID No', value: decl.disabilityIdNo, required: false },
      { name: 'Q40d: Solo Parent', value: decl.soloParent, required: true },
      { name: 'Q40d: Solo Parent ID No', value: decl.soloParentIdNo, required: false },
      { name: 'Government ID Type', value: decl.govtIdType, required: false },
      { name: 'Government ID No', value: decl.govtIdNo, required: false },
      { name: 'Government ID Issuance', value: decl.govtIdIssuance, required: false },
      { name: 'Date Accomplished', value: decl.dateAccomplished, required: true },
    ];

    declFields.forEach(field => {
      const status = field.value !== null && field.value !== undefined ? '✓' : '❌';
      const req = field.required ? '[REQUIRED]' : '[OPTIONAL]';
      const displayValue = field.value !== null && field.value !== undefined ? String(field.value) : '(missing)';
      console.log(`  ${status} ${field.name.padEnd(40)} ${req.padEnd(12)}: ${displayValue}`);
      if (field.value !== null && field.value !== undefined) totalPresent++; else totalMissing++;
    });
  }

  // ============================================================================
  // 4. FAMILY BACKGROUND
  // ============================================================================
  console.log('\n\n👨‍👩‍👧‍👦 SECTION 4: FAMILY BACKGROUND (pds_family)');
  console.log('-'.repeat(100));

  const family = await db.select()
    .from(pdsFamily)
    .where(eq(pdsFamily.employeeId, user.id));

  if (family.length === 0) {
    console.log('❌ NO FAMILY BACKGROUND RECORDS EXIST!');
    console.log('   Expected: Spouse, Father, Mother, Children (if any)');
    totalMissing += 4; // At minimum: spouse, father, mother, and optionally children
  } else {
    console.log(`✓ Found ${family.length} family member(s):`);
    family.forEach((member, idx) => {
      console.log(`\n  Member ${idx + 1} (${member.relationType}):`);
      console.log(`    Name: ${member.firstName || '(missing)'} ${member.middleName || ''} ${member.lastName || '(missing)'} ${member.nameExtension || ''}`);
      console.log(`    Occupation: ${member.occupation || '(missing)'}`);
      console.log(`    Employer: ${member.employer || '(missing)'}`);
      console.log(`    Date of Birth: ${member.dateOfBirth || '(missing)'}`);
    });
    totalPresent++;
  }

  // ============================================================================
  // 5. EDUCATION
  // ============================================================================
  console.log('\n\n🎓 SECTION 5: EDUCATIONAL BACKGROUND (pds_education)');
  console.log('-'.repeat(100));

  const education = await db.select()
    .from(pdsEducation)
    .where(eq(pdsEducation.employeeId, user.id));

  if (education.length === 0) {
    console.log('❌ NO EDUCATION RECORDS EXIST!');
    console.log('   Expected: Elementary, Secondary, and possibly Vocational/College/Graduate Studies');
    totalMissing += 2; // At minimum: Elementary and Secondary
  } else {
    console.log(`✓ Found ${education.length} education record(s):`);
    education.forEach((edu, idx) => {
      console.log(`\n  Record ${idx + 1} (${edu.level}):`);
      console.log(`    School: ${edu.schoolName}`);
      console.log(`    Degree/Course: ${edu.degreeCourse || '(N/A)'}`);
      console.log(`    Period: ${edu.dateFrom || '?'} - ${edu.dateTo || '?'}`);
      console.log(`    Year Graduated: ${edu.yearGraduated || '(N/A)'}`);
      console.log(`    Honors: ${edu.honors || '(none)'}`);
    });
    totalPresent++;
  }

  // ============================================================================
  // 6. ELIGIBILITY
  // ============================================================================
  console.log('\n\n🏅 SECTION 6: CIVIL SERVICE ELIGIBILITY (pds_eligibility)');
  console.log('-'.repeat(100));

  const eligibility = await db.select()
    .from(pdsEligibility)
    .where(eq(pdsEligibility.employeeId, user.id));

  if (eligibility.length === 0) {
    console.log('⚠️  NO ELIGIBILITY RECORDS EXIST (may be acceptable if no civil service exams passed)');
  } else {
    console.log(`✓ Found ${eligibility.length} eligibility record(s):`);
    eligibility.forEach((elig, idx) => {
      console.log(`\n  Record ${idx + 1}:`);
      console.log(`    Eligibility: ${elig.eligibilityName}`);
      console.log(`    Rating: ${elig.rating || '(N/A)'}`);
      console.log(`    Exam Date: ${elig.examDate || '(N/A)'}`);
      console.log(`    Exam Place: ${elig.examPlace || '(N/A)'}`);
      console.log(`    License No.: ${elig.licenseNumber || '(N/A)'}`);
      console.log(`    Validity: ${elig.validityDate || '(N/A)'}`);
    });
    totalPresent++;
  }

  // ============================================================================
  // 7. WORK EXPERIENCE
  // ============================================================================
  console.log('\n\n💼 SECTION 7: WORK EXPERIENCE (pds_work_experience)');
  console.log('-'.repeat(100));

  const workExp = await db.select()
    .from(pdsWorkExperience)
    .where(eq(pdsWorkExperience.employeeId, user.id));

  if (workExp.length === 0) {
    console.log('⚠️  NO WORK EXPERIENCE RECORDS EXIST (acceptable if fresh graduate)');
  } else {
    console.log(`✓ Found ${workExp.length} work experience record(s):`);
    workExp.forEach((work, idx) => {
      console.log(`\n  Record ${idx + 1}:`);
      console.log(`    Position: ${work.positionTitle}`);
      console.log(`    Company: ${work.companyName}`);
      console.log(`    Period: ${work.dateFrom} - ${work.dateTo || 'Present'}`);
      console.log(`    Salary: ${work.monthlySalary || '(N/A)'}`);
      console.log(`    Government: ${work.isGovernment ? 'Yes' : 'No'}`);
    });
    totalPresent++;
  }

  // ============================================================================
  // 8. LEARNING & DEVELOPMENT
  // ============================================================================
  console.log('\n\n📚 SECTION 8: LEARNING & DEVELOPMENT (pds_learning_development)');
  console.log('-'.repeat(100));

  const ld = await db.select()
    .from(pdsLearningDevelopment)
    .where(eq(pdsLearningDevelopment.employeeId, user.id));

  if (ld.length === 0) {
    console.log('⚠️  NO LEARNING & DEVELOPMENT RECORDS EXIST (acceptable if none attended)');
  } else {
    console.log(`✓ Found ${ld.length} L&D record(s):`);
    ld.forEach((training, idx) => {
      console.log(`\n  Record ${idx + 1}:`);
      console.log(`    Title: ${training.title}`);
      console.log(`    Type: ${training.typeOfLd || '(N/A)'}`);
      console.log(`    Hours: ${training.hoursNumber || '(N/A)'}`);
      console.log(`    Conducted By: ${training.conductedBy || '(N/A)'}`);
    });
    totalPresent++;
  }

  // ============================================================================
  // 9. VOLUNTARY WORK
  // ============================================================================
  console.log('\n\n🤝 SECTION 9: VOLUNTARY WORK (pds_voluntary_work)');
  console.log('-'.repeat(100));

  const volWork = await db.select()
    .from(pdsVoluntaryWork)
    .where(eq(pdsVoluntaryWork.employeeId, user.id));

  if (volWork.length === 0) {
    console.log('⚠️  NO VOLUNTARY WORK RECORDS EXIST (acceptable if none performed)');
  } else {
    console.log(`✓ Found ${volWork.length} voluntary work record(s):`);
    volWork.forEach((vol, idx) => {
      console.log(`\n  Record ${idx + 1}:`);
      console.log(`    Organization: ${vol.organizationName}`);
      console.log(`    Position: ${vol.position || '(N/A)'}`);
      console.log(`    Hours: ${vol.hoursNumber || '(N/A)'}`);
    });
    totalPresent++;
  }

  // ============================================================================
  // 10. OTHER INFORMATION
  // ============================================================================
  console.log('\n\n💡 SECTION 10: OTHER INFORMATION (pds_other_info)');
  console.log('-'.repeat(100));

  const otherInfo = await db.select()
    .from(pdsOtherInfo)
    .where(eq(pdsOtherInfo.employeeId, user.id));

  if (otherInfo.length === 0) {
    console.log('⚠️  NO OTHER INFORMATION RECORDS EXIST (Skills, Recognitions, Memberships)');
  } else {
    console.log(`✓ Found ${otherInfo.length} other info record(s):`);

    const skills = otherInfo.filter(i => i.type === 'Skill');
    const recognitions = otherInfo.filter(i => i.type === 'Recognition');
    const memberships = otherInfo.filter(i => i.type === 'Membership');

    console.log(`\n  Skills (${skills.length}):`);
    skills.forEach(s => console.log(`    - ${s.description}`));

    console.log(`\n  Recognitions (${recognitions.length}):`);
    recognitions.forEach(r => console.log(`    - ${r.description}`));

    console.log(`\n  Memberships (${memberships.length}):`);
    memberships.forEach(m => console.log(`    - ${m.description}`));

    totalPresent++;
  }

  // ============================================================================
  // 11. REFERENCES
  // ============================================================================
  console.log('\n\n👥 SECTION 11: CHARACTER REFERENCES (pds_references)');
  console.log('-'.repeat(100));

  const references = await db.select()
    .from(pdsReferences)
    .where(eq(pdsReferences.employeeId, user.id));

  if (references.length === 0) {
    console.log('❌ NO CHARACTER REFERENCES EXIST!');
    console.log('   Required: At least 3 character references');
    totalMissing += 3;
  } else {
    console.log(`✓ Found ${references.length} reference(s) (minimum 3 required):`);
    references.forEach((ref, idx) => {
      console.log(`\n  Reference ${idx + 1}:`);
      console.log(`    Name: ${ref.name}`);
      console.log(`    Address: ${ref.address || '(missing)'}`);
      console.log(`    Tel No.: ${ref.telNo || '(missing)'}`);
    });
    if (references.length >= 3) totalPresent++;
    else totalMissing++;
  }

  // ============================================================================
  // 12. EMERGENCY CONTACTS
  // ============================================================================
  console.log('\n\n🚨 SECTION 12: EMERGENCY CONTACTS (employee_emergency_contacts)');
  console.log('-'.repeat(100));

  const emergencyContacts = await db.select()
    .from(employeeEmergencyContacts)
    .where(eq(employeeEmergencyContacts.employeeId, user.id));

  if (emergencyContacts.length === 0) {
    console.log('❌ NO EMERGENCY CONTACTS EXIST!');
    console.log('   Required: At least 1 emergency contact');
    totalMissing += 1;
  } else {
    console.log(`✓ Found ${emergencyContacts.length} emergency contact(s):`);
    emergencyContacts.forEach((contact, idx) => {
      console.log(`\n  Contact ${idx + 1}:`);
      console.log(`    Name: ${contact.name}`);
      console.log(`    Relationship: ${contact.relationship}`);
      console.log(`    Phone: ${contact.phoneNumber}`);
      console.log(`    Email: ${contact.email || '(not provided)'}`);
      console.log(`    Primary: ${contact.isPrimary ? 'Yes' : 'No'}`);
    });
    totalPresent++;
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log('\n\n' + '='.repeat(100));
  console.log('AUDIT SUMMARY');
  console.log('='.repeat(100));
  console.log(`Total Fields Present: ${totalPresent}`);
  console.log(`Total Fields Missing: ${totalMissing}`);
  console.log(`Completion Rate: ${((totalPresent / (totalPresent + totalMissing)) * 100).toFixed(2)}%`);
  console.log('='.repeat(100));

  console.log('\n🔴 CRITICAL MISSING FIELDS (MUST BE FIXED):');
  console.log('  1. Birth Date (Personal Information)');
  console.log('  2. Sex at Birth / Gender (Personal Information)');
  console.log('  3. Civil Status (Personal Information)');
  console.log('  4. GSIS ID Number (Personal Information)');
  console.log('  5. All Declarations Questions (Q34-Q40)');
  console.log('  6. Date Accomplished (Declarations)');

  console.log('\n🟡 IMPORTANT MISSING SECTIONS:');
  if (family.length === 0) console.log('  - Family Background (Spouse, Father, Mother, Children)');
  if (education.length === 0) console.log('  - Educational Background (Elementary, Secondary minimum)');
  if (references.length < 3) console.log('  - Character References (3 required, ' + references.length + ' found)');
  if (emergencyContacts.length === 0) console.log('  - Emergency Contacts (at least 1 required)');

  console.log('\n✅ PROPERLY FILLED SECTIONS:');
  console.log('  ✓ Place of Birth');
  console.log('  ✓ Blood Type');
  console.log('  ✓ Height & Weight');
  console.log('  ✓ Mobile Number');
  console.log('  ✓ Government IDs (PAG-IBIG, PhilHealth, TIN, PhilSys)');
  console.log('  ✓ Complete Residential Address (including Region, Province, Municipality, Barangay)');
  console.log('  ✓ Complete Permanent Address (including Region, Province, Municipality, Barangay)');

  console.log('\n');
  process.exit(0);
}

comprehensiveAudit().catch(console.error);
