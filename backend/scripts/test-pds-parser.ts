/**
 * Test PDS Parser Script
 *
 * This script tests the PDS parser on a given Excel file to verify
 * that data is being extracted correctly.
 *
 * Usage:
 * npm run test-pds-parser <path-to-pds-file.xlsx>
 *
 * Example:
 * npm run test-pds-parser "C:\Users\Joshua\Desktop\Sofia_PDS.xlsx"
 */

import { PDSParserService } from '../services/PDSParserService.js';
import fs from 'fs';
import path from 'path';

const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Usage: npm run test-pds-parser <path-to-pds-file.xlsx>');
  console.error('   Example: npm run test-pds-parser "C:\\Users\\Joshua\\Desktop\\Sofia_PDS.xlsx"');
  process.exit(1);
}

async function testPdsParser() {
  console.log('🔍 PDS Parser Test');
  console.log('='.repeat(80));
  console.log(`File: ${filePath}\n`);

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.xlsx' && ext !== '.xls') {
      console.error(`❌ Invalid file type: ${ext}`);
      console.error('   Expected: .xlsx or .xls');
      process.exit(1);
    }

    console.log('✅ File exists and is valid Excel format\n');

    // Read file
    const buffer = await fs.promises.readFile(filePath);
    console.log(`📄 File size: ${(buffer.length / 1024).toFixed(2)} KB\n`);

    // Parse PDS
    console.log('⏳ Parsing PDS file...\n');
    const parsedData = await PDSParserService.parseFromBuffer(buffer);

    // Display results
    console.log('✅ Parsing Complete!\n');
    console.log('='.repeat(80));
    console.log('📊 Parsed Data Summary:\n');

    // Personal Info
    console.log('👤 PERSONAL INFORMATION:');
    console.log(`   Name: ${parsedData.firstName || 'N/A'} ${parsedData.middleName || ''} ${parsedData.lastName || 'N/A'}`);
    console.log(`   Email: ${parsedData.email || 'N/A'}`);

    if (parsedData.personal) {
      const p = parsedData.personal;
      console.log(`   Birth Date: ${p.birthDate || 'N/A'}`);
      console.log(`   Place of Birth: ${p.placeOfBirth || 'N/A'}`);
      console.log(`   Gender: ${p.gender || 'N/A'}`);
      console.log(`   Civil Status: ${p.civilStatus || 'N/A'}`);
      console.log(`   Height: ${p.heightM || 'N/A'} m`);
      console.log(`   Weight: ${p.weightKg || 'N/A'} kg`);
      console.log(`   Blood Type: ${p.bloodType || 'N/A'}`);
      console.log(`   Citizenship: ${p.citizenship || 'N/A'}`);
      console.log(`   Citizenship Type: ${p.citizenshipType || 'N/A'}`);
      console.log(`   Dual Country: ${p.dualCountry || 'N/A'}`);
      console.log(`\n   📱 Contact:`);
      console.log(`   Mobile: ${p.mobileNo || 'N/A'}`);
      console.log(`   Telephone: ${p.telephoneNo || 'N/A'}`);
      console.log(`\n   🆔 Government IDs:`);
      console.log(`   GSIS: ${p.gsisNumber || 'N/A'}`);
      console.log(`   Pag-IBIG: ${p.pagibigNumber || 'N/A'}`);
      console.log(`   PhilHealth: ${p.philhealthNumber || 'N/A'}`);
      console.log(`   SSS: ${p.sssNumber || 'N/A'}`);
      console.log(`   TIN: ${p.tinNumber || 'N/A'}`);
      console.log(`   UMID: ${p.umidNumber || 'N/A'}`);
      console.log(`   PhilSys: ${p.philsysId || 'N/A'}`);
      console.log(`\n   🏠 Residential Address:`);
      console.log(`   House/Block/Lot: ${p.resHouseBlockLot || 'N/A'}`);
      console.log(`   Street: ${p.resStreet || 'N/A'}`);
      console.log(`   Subdivision: ${p.resSubdivision || 'N/A'}`);
      console.log(`   Barangay: ${p.resBarangay || 'N/A'}`);
      console.log(`   City: ${p.resCity || 'N/A'}`);
      console.log(`   Province: ${p.resProvince || 'N/A'}`);
      console.log(`   Region: ${p.resRegion || 'N/A'}`);
      console.log(`   Zip Code: ${p.residentialZipCode || 'N/A'}`);
    }

    // Education
    console.log(`\n🎓 EDUCATION: ${parsedData.educations?.length || 0} records`);
    if (parsedData.educations && parsedData.educations.length > 0) {
      parsedData.educations.forEach((edu, idx) => {
        console.log(`   ${idx + 1}. ${edu.level}: ${edu.schoolName || 'N/A'}`);
        console.log(`      Course: ${edu.degreeCourse || 'N/A'}`);
        console.log(`      Period: ${edu.dateFrom || 'N/A'} - ${edu.dateTo || 'N/A'}`);
        console.log(`      Year Graduated: ${edu.yearGraduated || 'N/A'}`);

        if (edu.dateFrom && edu.dateFrom.length > 4) {
          console.warn(`      ⚠️  WARNING: dateFrom should be year only, got: ${edu.dateFrom}`);
        }
        if (edu.dateTo && edu.dateTo.length > 4 && edu.dateTo !== 'Present') {
          console.warn(`      ⚠️  WARNING: dateTo should be year only, got: ${edu.dateTo}`);
        }
      });
    }

    // Family
    console.log(`\n👨‍👩‍👧‍👦 FAMILY: ${parsedData.familyBackground?.length || 0} records`);
    if (parsedData.familyBackground && parsedData.familyBackground.length > 0) {
      parsedData.familyBackground.forEach((fam, idx) => {
        console.log(`   ${idx + 1}. ${fam.relationType}: ${fam.firstName || ''} ${fam.lastName || ''}`);
      });
    }

    // Eligibility
    console.log(`\n🏆 ELIGIBILITY: ${parsedData.eligibilities?.length || 0} records`);
    if (parsedData.eligibilities && parsedData.eligibilities.length > 0) {
      parsedData.eligibilities.forEach((elig, idx) => {
        console.log(`   ${idx + 1}. ${elig.eligibilityName || 'N/A'}`);
      });
    }

    // Work Experience
    console.log(`\n💼 WORK EXPERIENCE: ${parsedData.workExperiences?.length || 0} records`);
    if (parsedData.workExperiences && parsedData.workExperiences.length > 0) {
      parsedData.workExperiences.forEach((work, idx) => {
        console.log(`   ${idx + 1}. ${work.positionTitle || 'N/A'} at ${work.companyName || 'N/A'}`);
        console.log(`      Period: ${work.dateFrom || 'N/A'} - ${work.dateTo || 'N/A'}`);
      });
    }

    // Other sections
    console.log(`\n🤝 VOLUNTARY WORK: ${parsedData.voluntaryWorks?.length || 0} records`);
    console.log(`📚 LEARNING & DEVELOPMENT: ${parsedData.learningDevelopments?.length || 0} records`);
    console.log(`ℹ️  OTHER INFO: ${parsedData.otherInfo?.length || 0} records`);
    console.log(`👥 REFERENCES: ${parsedData.references?.length || 0} records`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Parser test complete!\n');

    // Field population analysis
    if (parsedData.personal) {
      const fields = [
        'birthDate', 'placeOfBirth', 'gender', 'civilStatus', 'heightM', 'weightKg', 'bloodType',
        'citizenship', 'citizenshipType', 'dualCountry', 'telephoneNo', 'mobileNo',
        'gsisNumber', 'pagibigNumber', 'philhealthNumber', 'sssNumber', 'tinNumber',
        'umidNumber', 'philsysId', 'agencyEmployeeNo'
      ];

      const populated = fields.filter(f => {
        const val = parsedData.personal?.[f as keyof typeof parsedData.personal];
        return val != null && val !== '';
      });

      console.log('📊 Personal Info Field Analysis:');
      console.log(`   Populated: ${populated.length}/${fields.length} (${Math.round(populated.length / fields.length * 100)}%)`);
      console.log(`   Missing: ${fields.length - populated.length} fields\n`);
    }

  } catch (error: any) {
    console.error('\n❌ Parser Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testPdsParser();
