/**
 * Sofia Profile Debug Script
 *
 * This script checks if Sofia's data exists in the database and identifies
 * why it might not be displaying in the frontend.
 */

import { db } from '../db/index.js';
import { authentication } from '../db/schema.js';
import { eq, like, or } from 'drizzle-orm';

const debugSofiaProfile = async () => {
  console.log('\n' + '='.repeat(80));
  console.log('SOFIA PROFILE DEBUG REPORT');
  console.log('='.repeat(80) + '\n');

  try {
    // Search for Sofia in multiple ways
    console.log('🔍 Searching for Sofia in database...\n');

    // Method 1: Search by employeeId
    const byEmployeeId = await db.select()
      .from(authentication)
      .where(eq(authentication.employeeId, 'Emp-001'))
      .limit(1);

    // Method 2: Search by first name
    const byFirstName = await db.select()
      .from(authentication)
      .where(like(authentication.firstName, '%Sofia%'))
      .limit(5);

    // Method 3: Search by last name
    const byLastName = await db.select()
      .from(authentication)
      .where(like(authentication.lastName, '%Reyes%'))
      .limit(5);

    // Method 4: Search by email
    const byEmail = await db.select()
      .from(authentication)
      .where(or(
        like(authentication.email, '%sofia%'),
        like(authentication.email, '%reyes%')
      ))
      .limit(5);

    console.log('Search Results:');
    console.log('================\n');

    if (byEmployeeId.length > 0) {
      console.log('✅ Found by Employee ID (Emp-001):');
      const sofia = byEmployeeId[0];
      console.log(`   ID: ${sofia.id}`);
      console.log(`   Employee ID: ${sofia.employeeId}`);
      console.log(`   Name: ${sofia.firstName} ${sofia.middleName} ${sofia.lastName}`);
      console.log(`   Email: ${sofia.email}`);
      console.log(`   Role: ${sofia.role}`);
      console.log(`   Verified: ${sofia.isVerified ? 'Yes' : 'No'}`);

      // Now check all related data
      await checkRelatedData(sofia.id);
    } else {
      console.log('❌ NOT FOUND by Employee ID (Emp-001)');
      console.log('   The SQL script may not have been run yet.\n');
    }

    if (byFirstName.length > 0) {
      console.log('\n📋 Users with "Sofia" in first name:');
      byFirstName.forEach((user, idx) => {
        console.log(`   ${idx + 1}. ID: ${user.id}, Emp ID: ${user.employeeId}, Name: ${user.firstName} ${user.lastName}`);
      });
    }

    if (byLastName.length > 0) {
      console.log('\n📋 Users with "Reyes" in last name:');
      byLastName.forEach((user, idx) => {
        console.log(`   ${idx + 1}. ID: ${user.id}, Emp ID: ${user.employeeId}, Name: ${user.firstName} ${user.lastName}`);
      });
    }

    if (byEmail.length > 0) {
      console.log('\n📋 Users with "sofia" or "reyes" in email:');
      byEmail.forEach((user, idx) => {
        console.log(`   ${idx + 1}. ID: ${user.id}, Email: ${user.email}`);
      });
    }

    // Check total users in database
    const allUsers = await db.select().from(authentication);
    console.log(`\n📊 Total users in database: ${allUsers.length}`);

    if (allUsers.length > 0) {
      console.log('\nAll users in authentication table:');
      allUsers.slice(0, 10).forEach((user, idx) => {
        console.log(`   ${idx + 1}. ${user.employeeId} - ${user.firstName} ${user.lastName} (${user.email})`);
      });
      if (allUsers.length > 10) {
        console.log(`   ... and ${allUsers.length - 10} more users`);
      }
    }

    console.log('\n' + '='.repeat(80));

    if (byEmployeeId.length === 0) {
      console.log('\n❌ ISSUE IDENTIFIED: Sofia (Emp-001) does not exist in database');
      console.log('\n📝 SOLUTION:');
      console.log('   1. Run the SQL script to insert Sofia\'s data:');
      console.log('      mysql -u root -p nebr_db < backend/scripts/insert-sofia-complete-data.sql');
      console.log('\n   2. Or manually create Sofia\'s account through the admin panel\n');
    }

  } catch (error) {
    console.error('\n❌ Database Error:', error);
    console.log('\nPossible causes:');
    console.log('1. Database connection not configured');
    console.log('2. Database tables not created');
    console.log('3. Database credentials incorrect\n');
  }
};

const checkRelatedData = async (employeeId: number) => {
  console.log('\n' + '='.repeat(80));
  console.log('CHECKING RELATED PDS DATA FOR SOFIA');
  console.log('='.repeat(80) + '\n');

  try {
    const { pdsHrDetails } = await import('../db/schema.js');
    const {
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
    } = await import('../db/tables/pds.js');

    const checks = [
      { table: pdsHrDetails, name: 'HR Details', field: 'employeeId' },
      { table: pdsPersonalInformation, name: 'Personal Information', field: 'employeeId' },
      { table: pdsFamily, name: 'Family Background', field: 'employeeId' },
      { table: pdsEducation, name: 'Education', field: 'employeeId' },
      { table: pdsEligibility, name: 'Eligibility', field: 'employeeId' },
      { table: pdsWorkExperience, name: 'Work Experience', field: 'employeeId' },
      { table: pdsVoluntaryWork, name: 'Voluntary Work', field: 'employeeId' },
      { table: pdsLearningDevelopment, name: 'Learning & Development', field: 'employeeId' },
      { table: pdsOtherInfo, name: 'Other Info', field: 'employeeId' },
      { table: pdsReferences, name: 'References', field: 'employeeId' },
      { table: pdsDeclarations, name: 'Declarations', field: 'employeeId' },
      { table: employeeEmergencyContacts, name: 'Emergency Contacts', field: 'employeeId' },
    ];

    let totalRecords = 0;
    let missingTables: string[] = [];

    for (const check of checks) {
      const records = await db.select().from(check.table).where(eq(check.table[check.field], employeeId));
      const icon = records.length > 0 ? '✅' : '❌';
      const status = records.length > 0 ? `${records.length} record(s)` : 'MISSING';

      console.log(`${icon} ${check.name.padEnd(30)} ${status}`);

      totalRecords += records.length;
      if (records.length === 0) {
        missingTables.push(check.name);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`Total PDS Records: ${totalRecords}`);

    if (missingTables.length > 0) {
      console.log('\n⚠️  Missing Data Sections:');
      missingTables.forEach(table => console.log(`   - ${table}`));
      console.log('\n📝 SOLUTION:');
      console.log('   Run the complete SQL script to populate all sections:');
      console.log('   mysql -u root -p nebr_db < backend/scripts/insert-sofia-complete-data.sql\n');
    } else {
      console.log('\n✅ All PDS sections have data!');
      console.log('\nIf frontend still not showing data, check:');
      console.log('1. Frontend API calls are using correct employee ID');
      console.log('2. Browser console for API errors');
      console.log('3. Network tab to see if API requests are successful');
      console.log('4. Redux/state management is updating correctly\n');
    }

  } catch (error) {
    console.error('\n❌ Error checking related data:', error);
  }
};

// Run the debug
debugSofiaProfile();
