import { db } from './db/index.js';
import { authentication } from './db/schema.js';
import { pdsPersonalInformation } from './db/tables/pds.js';
import { eq } from 'drizzle-orm';

async function debugJoshuaProfile() {
  console.log('='.repeat(80));
  console.log('DEBUGGING JOSHUA\'S PROFILE - STEP BY STEP');
  console.log('='.repeat(80));

  // Step 1: Find Joshua's account
  console.log('\n[STEP 1] Finding Joshua\'s account...');
  const user = await db.query.authentication.findFirst({
    where: eq(authentication.email, 'joshuapalero111@gmail.com')
  });

  if (!user) {
    console.log('❌ User not found!');
    process.exit(1);
  }

  console.log('✓ User found:');
  console.log(`  - ID: ${user.id}`);
  console.log(`  - Name: ${user.firstName} ${user.middleName} ${user.lastName}`);
  console.log(`  - Email: ${user.email}`);
  console.log(`  - Employee ID: ${user.employeeId}`);

  // Step 2: Check PDS Personal Information
  console.log('\n[STEP 2] Checking PDS Personal Information...');
  const personalInfo = await db.select()
    .from(pdsPersonalInformation)
    .where(eq(pdsPersonalInformation.employeeId, user.id))
    .limit(1);

  if (personalInfo.length === 0) {
    console.log('❌ No PDS Personal Information found! Creating default record...');

    // Create a default PDS personal information record
    await db.insert(pdsPersonalInformation).values({
      employeeId: user.id,
      birthDate: null,
      placeOfBirth: null,
      gender: null,
      civilStatus: null,
      heightM: null,
      weightKg: null,
      bloodType: null,
      citizenship: 'Filipino',
      citizenshipType: null,
      dualCountry: null,
      telephoneNo: null,
      mobileNo: null,
      gsisNumber: null,
      pagibigNumber: null,
      philhealthNumber: null,
      tinNumber: null,
      umidNumber: null,
      philsysId: null,
      agencyEmployeeNo: null,
      resHouseBlockLot: null,
      resStreet: null,
      resSubdivision: null,
      resBarangay: null,
      resCity: null,
      resProvince: null,
      resRegion: null,
      residentialZipCode: null,
      permHouseBlockLot: null,
      permStreet: null,
      permSubdivision: null,
      permBarangay: null,
      permCity: null,
      permProvince: null,
      permRegion: null,
      permanentZipCode: null
    });

    console.log('✓ Created default PDS Personal Information record');
  } else {
    const pds = personalInfo[0];
    console.log('✓ PDS Personal Information found. Checking fields...\n');

    // Step 3: Check which fields are missing
    console.log('[STEP 3] Field Analysis:');
    console.log('-'.repeat(80));

    const fields = [
      { name: 'Birth Date', value: pds.birthDate },
      { name: 'Place of Birth', value: pds.placeOfBirth },
      { name: 'Gender/Sex', value: pds.gender },
      { name: 'Civil Status', value: pds.civilStatus },
      { name: 'Height (m)', value: pds.heightM },
      { name: 'Weight (kg)', value: pds.weightKg },
      { name: 'Blood Type', value: pds.bloodType },
      { name: 'Citizenship', value: pds.citizenship },
      { name: 'Citizenship Type', value: pds.citizenshipType },
      { name: 'Dual Country', value: pds.dualCountry },
      { name: 'Telephone', value: pds.telephoneNo },
      { name: 'Mobile', value: pds.mobileNo },
      { name: 'GSIS Number', value: pds.gsisNumber },
      { name: 'Pag-IBIG Number', value: pds.pagibigNumber },
      { name: 'PhilHealth Number', value: pds.philhealthNumber },
      { name: 'TIN Number', value: pds.tinNumber },
      { name: 'UMID Number', value: pds.umidNumber },
      { name: 'PhilSys ID', value: pds.philsysId },
      { name: 'Agency Employee No', value: pds.agencyEmployeeNo },
    ];

    const addressFields = [
      { section: 'RESIDENTIAL ADDRESS', fields: [
        { name: 'House/Block/Lot', value: pds.resHouseBlockLot },
        { name: 'Street', value: pds.resStreet },
        { name: 'Subdivision', value: pds.resSubdivision },
        { name: 'Barangay', value: pds.resBarangay },
        { name: 'City/Municipality', value: pds.resCity },
        { name: 'Province', value: pds.resProvince },
        { name: 'Region', value: pds.resRegion },
        { name: 'Zip Code', value: pds.residentialZipCode },
      ]},
      { section: 'PERMANENT ADDRESS', fields: [
        { name: 'House/Block/Lot', value: pds.permHouseBlockLot },
        { name: 'Street', value: pds.permStreet },
        { name: 'Subdivision', value: pds.permSubdivision },
        { name: 'Barangay', value: pds.permBarangay },
        { name: 'City/Municipality', value: pds.permCity },
        { name: 'Province', value: pds.permProvince },
        { name: 'Region', value: pds.permRegion },
        { name: 'Zip Code', value: pds.permanentZipCode },
      ]}
    ];

    // Check personal fields
    console.log('\n📋 PERSONAL INFORMATION:');
    let missingCount = 0;
    fields.forEach(field => {
      const status = field.value ? '✓' : '❌';
      const displayValue = field.value || '(missing)';
      console.log(`  ${status} ${field.name.padEnd(25)}: ${displayValue}`);
      if (!field.value) missingCount++;
    });

    // Check address fields
    addressFields.forEach(section => {
      console.log(`\n📍 ${section.section}:`);
      section.fields.forEach(field => {
        const status = field.value ? '✓' : '❌';
        const displayValue = field.value || '(missing)';
        console.log(`  ${status} ${field.name.padEnd(25)}: ${displayValue}`);
        if (!field.value) missingCount++;
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log(`SUMMARY: ${missingCount} fields are missing or empty`);
    console.log('='.repeat(80));
  }

  process.exit(0);
}

debugJoshuaProfile().catch(console.error);
