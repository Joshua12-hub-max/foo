/**
 * PDS Display Diagnostic Script
 *
 * This script helps diagnose why PDS data uploaded from Excel files
 * is not displaying correctly in the profile view.
 *
 * Usage:
 * ts-node backend/scripts/diagnose-pds-display.ts <employee-id>
 *
 * Example:
 * ts-node backend/scripts/diagnose-pds-display.ts 1
 */

import { db } from '../db/index.js';
import { authentication, pdsPersonalInformation } from '../db/schema.js';
import {
  pdsEducation,
  pdsEligibility,
  pdsFamily,
  pdsWorkExperience,
  pdsVoluntaryWork,
  pdsLearningDevelopment,
  pdsOtherInfo,
  pdsReferences,
} from '../db/tables/pds.js';
import { eq } from 'drizzle-orm';

const employeeId = parseInt(process.argv[2]);

if (!employeeId || isNaN(employeeId)) {
  console.error('❌ Usage: ts-node backend/scripts/diagnose-pds-display.ts <employee-id>');
  process.exit(1);
}

async function diagnosePdsDisplay() {
  console.log('🔍 PDS Display Diagnostic Report');
  console.log('='.repeat(80));
  console.log(`Employee ID: ${employeeId}\n`);

  try {
    // 1. Fetch authentication record
    const [authRecord] = await db.select().from(authentication).where(eq(authentication.id, employeeId)).limit(1);

    if (!authRecord) {
      console.error(`❌ No employee found with ID: ${employeeId}`);
      process.exit(1);
    }

    console.log('✅ Authentication Record:');
    console.log(`   Name: ${authRecord.firstName} ${authRecord.middleName || ''} ${authRecord.lastName}`);
    console.log(`   Email: ${authRecord.email}`);
    console.log(`   Employee ID: ${authRecord.employeeId}`);
    console.log(`   Role: ${authRecord.role}\n`);

    // 2. Fetch PDS Personal Information
    const [personalInfo] = await db.select().from(pdsPersonalInformation).where(eq(pdsPersonalInformation.employeeId, employeeId)).limit(1);

    if (!personalInfo) {
      console.warn('⚠️  No PDS Personal Information found');
    } else {
      console.log('✅ PDS Personal Information:');
      const fields = [
        'birthDate', 'placeOfBirth', 'gender', 'civilStatus', 'heightM', 'weightKg', 'bloodType',
        'citizenship', 'citizenshipType', 'dualCountry', 'telephoneNo', 'mobileNo',
        'gsisNumber', 'pagibigNumber', 'philhealthNumber', 'sssNumber', 'tinNumber', 'umidNumber', 'philsysId', 'agencyEmployeeNo',
        'resHouseBlockLot', 'resStreet', 'resSubdivision', 'resBarangay', 'resCity', 'resProvince', 'resRegion', 'residentialZipCode',
        'permHouseBlockLot', 'permStreet', 'permSubdivision', 'permBarangay', 'permCity', 'permProvince', 'permRegion', 'permanentZipCode'
      ];

      const populated = fields.filter(f => personalInfo[f as keyof typeof personalInfo] != null);
      const empty = fields.filter(f => personalInfo[f as keyof typeof personalInfo] == null);

      console.log(`   📊 Field Population: ${populated.length}/${fields.length} (${Math.round(populated.length / fields.length * 100)}%)`);
      console.log(`   ✅ Populated: ${populated.join(', ')}`);
      if (empty.length > 0) {
        console.log(`   ❌ Empty: ${empty.join(', ')}`);
      }
      console.log();
    }

    // 3. Check Education Records
    const educationRecords = await db.select().from(pdsEducation).where(eq(pdsEducation.employeeId, employeeId));
    console.log(`✅ Education Records: ${educationRecords.length} found`);
    if (educationRecords.length > 0) {
      educationRecords.forEach((edu, idx) => {
        console.log(`   ${idx + 1}. ${edu.level}: ${edu.schoolName || 'N/A'} (${edu.dateFrom || 'N/A'} - ${edu.dateTo || 'N/A'})`);
        if (edu.dateFrom && edu.dateFrom.length > 4) {
          console.warn(`      ⚠️  WARNING: dateFrom should be year only (YYYY), but got: ${edu.dateFrom}`);
        }
        if (edu.dateTo && edu.dateTo.length > 4) {
          console.warn(`      ⚠️  WARNING: dateTo should be year only (YYYY), but got: ${edu.dateTo}`);
        }
      });
    }
    console.log();

    // 4. Check Family Records
    const familyRecords = await db.select().from(pdsFamily).where(eq(pdsFamily.employeeId, employeeId));
    console.log(`✅ Family Records: ${familyRecords.length} found`);
    familyRecords.forEach((fam, idx) => {
      console.log(`   ${idx + 1}. ${fam.relationType}: ${fam.firstName || ''} ${fam.lastName || ''}`);
    });
    console.log();

    // 5. Check Eligibility Records
    const eligibilityRecords = await db.select().from(pdsEligibility).where(eq(pdsEligibility.employeeId, employeeId));
    console.log(`✅ Eligibility Records: ${eligibilityRecords.length} found`);
    eligibilityRecords.forEach((elig, idx) => {
      console.log(`   ${idx + 1}. ${elig.eligibilityName || 'N/A'} - ${elig.examDate || 'N/A'}`);
    });
    console.log();

    // 6. Check Work Experience Records
    const workRecords = await db.select().from(pdsWorkExperience).where(eq(pdsWorkExperience.employeeId, employeeId));
    console.log(`✅ Work Experience Records: ${workRecords.length} found`);
    workRecords.forEach((work, idx) => {
      console.log(`   ${idx + 1}. ${work.positionTitle || 'N/A'} at ${work.companyName || 'N/A'} (${work.dateFrom || 'N/A'} - ${work.dateTo || 'N/A'})`);
    });
    console.log();

    // 7. Check Voluntary Work Records
    const voluntaryRecords = await db.select().from(pdsVoluntaryWork).where(eq(pdsVoluntaryWork.employeeId, employeeId));
    console.log(`✅ Voluntary Work Records: ${voluntaryRecords.length} found`);
    console.log();

    // 8. Check Learning & Development Records
    const ldRecords = await db.select().from(pdsLearningDevelopment).where(eq(pdsLearningDevelopment.employeeId, employeeId));
    console.log(`✅ Learning & Development Records: ${ldRecords.length} found`);
    console.log();

    // 9. Check Other Info Records
    const otherInfoRecords = await db.select().from(pdsOtherInfo).where(eq(pdsOtherInfo.employeeId, employeeId));
    console.log(`✅ Other Info Records: ${otherInfoRecords.length} found`);
    console.log();

    // 10. Check References
    const referenceRecords = await db.select().from(pdsReferences).where(eq(pdsReferences.employeeId, employeeId));
    console.log(`✅ Reference Records: ${referenceRecords.length} found`);
    referenceRecords.forEach((ref, idx) => {
      console.log(`   ${idx + 1}. ${ref.name || 'N/A'} - ${ref.telNo || 'N/A'}`);
    });
    console.log();

    console.log('='.repeat(80));
    console.log('🏁 Diagnostic Complete\n');

    // Summary
    const totalRecords = educationRecords.length + familyRecords.length + eligibilityRecords.length +
                         workRecords.length + voluntaryRecords.length + ldRecords.length +
                         otherInfoRecords.length + referenceRecords.length;

    console.log('📊 Summary:');
    console.log(`   Personal Info: ${personalInfo ? 'Present' : 'Missing'}`);
    console.log(`   Total PDS Records: ${totalRecords}`);
    console.log(`   Education: ${educationRecords.length}`);
    console.log(`   Family: ${familyRecords.length}`);
    console.log(`   Eligibility: ${eligibilityRecords.length}`);
    console.log(`   Work Experience: ${workRecords.length}`);
    console.log(`   Voluntary Work: ${voluntaryRecords.length}`);
    console.log(`   Learning & Development: ${ldRecords.length}`);
    console.log(`   Other Info: ${otherInfoRecords.length}`);
    console.log(`   References: ${referenceRecords.length}`);

  } catch (error) {
    console.error('❌ Error during diagnostic:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

diagnosePdsDisplay();
