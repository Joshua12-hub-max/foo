/**
 * PDS Display Diagnostic Script v2
 *
 * This script helps diagnose why PDS data uploaded from Excel files
 * is not displaying correctly in the profile view.
 *
 * Usage:
 * ts-node backend/scripts/diagnose-pds-display-v2.ts <employee-id>
 *
 * Accepts either numeric ID (1, 2, 3) or employee ID (Emp-010, Emp-001)
 *
 * Examples:
 * ts-node backend/scripts/diagnose-pds-display-v2.ts 1
 * ts-node backend/scripts/diagnose-pds-display-v2.ts Emp-010
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
import { eq, sql } from 'drizzle-orm';
import { normalizeIdSql } from '../utils/idUtils.js';

const inputId = process.argv[2];

if (!inputId) {
  console.error('❌ Usage: ts-node backend/scripts/diagnose-pds-display-v2.ts <employee-id>');
  console.error('   Example: ts-node backend/scripts/diagnose-pds-display-v2.ts Emp-010');
  console.error('   Example: ts-node backend/scripts/diagnose-pds-display-v2.ts 10');
  process.exit(1);
}

async function diagnosePdsDisplay() {
  console.log('🔍 PDS Display Diagnostic Report v2');
  console.log('='.repeat(80));
  console.log(`Input ID: ${inputId}\n`);

  try {
    // Determine if input is numeric ID or employee ID string
    let authRecord;

    if (/^\d+$/.test(inputId)) {
      // Numeric ID - query by primary key
      const numericId = parseInt(inputId);
      [authRecord] = await db.select().from(authentication).where(eq(authentication.id, numericId)).limit(1);
    } else {
      // Employee ID string - query by employeeId field
      const [result] = await db.select().from(authentication).where(
        sql`${normalizeIdSql(authentication.employeeId)} = ${inputId}`
      ).limit(1);
      authRecord = result;
    }

    if (!authRecord) {
      console.error(`❌ No employee found with ID: ${inputId}`);
      console.error('   Make sure the employee exists in the database.');
      process.exit(1);
    }

    const employeeId = authRecord.id;

    console.log('✅ Authentication Record:');
    console.log(`   Database ID: ${authRecord.id}`);
    console.log(`   Name: ${authRecord.firstName} ${authRecord.middleName || ''} ${authRecord.lastName}`);
    console.log(`   Email: ${authRecord.email}`);
    console.log(`   Employee ID: ${authRecord.employeeId}`);
    console.log(`   Role: ${authRecord.role}\n`);

    // 2. Fetch PDS Personal Information
    const [personalInfo] = await db.select().from(pdsPersonalInformation).where(eq(pdsPersonalInformation.employeeId, employeeId)).limit(1);

    if (!personalInfo) {
      console.warn('⚠️  No PDS Personal Information found');
      console.warn('   This employee has no PDS data uploaded yet.\n');
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

      if (populated.length > 0) {
        console.log(`\n   ✅ Populated Fields (${populated.length}):`);
        populated.forEach(field => {
          const value = personalInfo[field as keyof typeof personalInfo];
          console.log(`      - ${field}: ${value}`);
        });
      }

      if (empty.length > 0) {
        console.log(`\n   ❌ Empty Fields (${empty.length}):`);
        console.log(`      ${empty.join(', ')}`);
      }

      // Check for the recently added critical fields
      console.log('\n   🔑 Critical Fields Status:');
      console.log(`      - sssNumber: ${personalInfo.sssNumber || '❌ NOT SET'}`);
      console.log(`      - citizenshipType: ${personalInfo.citizenshipType || '❌ NOT SET'}`);
      console.log(`      - dualCountry: ${personalInfo.dualCountry || '❌ NOT SET'}`);
      console.log();
    }

    // 3. Check Education Records
    const educationRecords = await db.select().from(pdsEducation).where(eq(pdsEducation.employeeId, employeeId));
    console.log(`✅ Education Records: ${educationRecords.length} found`);
    if (educationRecords.length > 0) {
      educationRecords.forEach((edu, idx) => {
        console.log(`   ${idx + 1}. ${edu.level}: ${edu.schoolName || 'N/A'}`);
        console.log(`      Period: ${edu.dateFrom || 'N/A'} - ${edu.dateTo || 'N/A'}`);
        console.log(`      Course: ${edu.degreeCourse || 'N/A'}`);
        console.log(`      Year Graduated: ${edu.yearGraduated || 'N/A'}`);

        if (edu.dateFrom && edu.dateFrom.length > 4) {
          console.warn(`      ⚠️  WARNING: dateFrom should be year only (YYYY), but got: ${edu.dateFrom}`);
        }
        if (edu.dateTo && edu.dateTo.length > 4 && edu.dateTo !== 'Present') {
          console.warn(`      ⚠️  WARNING: dateTo should be year only (YYYY), but got: ${edu.dateTo}`);
        }
      });
    } else {
      console.log('   No education records found.');
    }
    console.log();

    // 4. Check Family Records
    const familyRecords = await db.select().from(pdsFamily).where(eq(pdsFamily.employeeId, employeeId));
    console.log(`✅ Family Records: ${familyRecords.length} found`);
    if (familyRecords.length > 0) {
      familyRecords.forEach((fam, idx) => {
        console.log(`   ${idx + 1}. ${fam.relationType}: ${fam.firstName || ''} ${fam.lastName || ''}`);
      });
    }
    console.log();

    // 5. Check Eligibility Records
    const eligibilityRecords = await db.select().from(pdsEligibility).where(eq(pdsEligibility.employeeId, employeeId));
    console.log(`✅ Eligibility Records: ${eligibilityRecords.length} found`);
    if (eligibilityRecords.length > 0) {
      eligibilityRecords.forEach((elig, idx) => {
        console.log(`   ${idx + 1}. ${elig.eligibilityName || 'N/A'} - ${elig.examDate || 'N/A'}`);
      });
    }
    console.log();

    // 6. Check Work Experience Records
    const workRecords = await db.select().from(pdsWorkExperience).where(eq(pdsWorkExperience.employeeId, employeeId));
    console.log(`✅ Work Experience Records: ${workRecords.length} found`);
    if (workRecords.length > 0) {
      workRecords.forEach((work, idx) => {
        console.log(`   ${idx + 1}. ${work.positionTitle || 'N/A'} at ${work.companyName || 'N/A'}`);
        console.log(`      Period: ${work.dateFrom || 'N/A'} - ${work.dateTo || 'N/A'}`);
      });
    }
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
    if (referenceRecords.length > 0) {
      referenceRecords.forEach((ref, idx) => {
        console.log(`   ${idx + 1}. ${ref.name || 'N/A'} - ${ref.telNo || 'N/A'}`);
      });
    }
    console.log();

    console.log('='.repeat(80));
    console.log('🏁 Diagnostic Complete\n');

    // Summary
    const totalRecords = educationRecords.length + familyRecords.length + eligibilityRecords.length +
                         workRecords.length + voluntaryRecords.length + ldRecords.length +
                         otherInfoRecords.length + referenceRecords.length;

    console.log('📊 Summary:');
    console.log(`   Database ID: ${employeeId}`);
    console.log(`   Employee ID: ${authRecord.employeeId}`);
    console.log(`   Personal Info: ${personalInfo ? '✅ Present' : '❌ Missing'}`);
    console.log(`   Total PDS Records: ${totalRecords}`);
    console.log(`   ├─ Education: ${educationRecords.length}`);
    console.log(`   ├─ Family: ${familyRecords.length}`);
    console.log(`   ├─ Eligibility: ${eligibilityRecords.length}`);
    console.log(`   ├─ Work Experience: ${workRecords.length}`);
    console.log(`   ├─ Voluntary Work: ${voluntaryRecords.length}`);
    console.log(`   ├─ Learning & Development: ${ldRecords.length}`);
    console.log(`   ├─ Other Info: ${otherInfoRecords.length}`);
    console.log(`   └─ References: ${referenceRecords.length}`);

    if (personalInfo) {
      const fields = [
        'birthDate', 'placeOfBirth', 'gender', 'civilStatus', 'heightM', 'weightKg', 'bloodType',
        'citizenship', 'citizenshipType', 'dualCountry', 'telephoneNo', 'mobileNo',
        'gsisNumber', 'pagibigNumber', 'philhealthNumber', 'sssNumber', 'tinNumber', 'umidNumber', 'philsysId', 'agencyEmployeeNo',
        'resHouseBlockLot', 'resStreet', 'resSubdivision', 'resBarangay', 'resCity', 'resProvince', 'resRegion', 'residentialZipCode',
        'permHouseBlockLot', 'permStreet', 'permSubdivision', 'permBarangay', 'permCity', 'permProvince', 'permRegion', 'permanentZipCode'
      ];
      const populated = fields.filter(f => personalInfo[f as keyof typeof personalInfo] != null);
      console.log(`\n   Personal Info Fields: ${populated.length}/${fields.length} populated (${Math.round(populated.length / fields.length * 100)}%)`);
    }

  } catch (error) {
    console.error('❌ Error during diagnostic:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

diagnosePdsDisplay();
