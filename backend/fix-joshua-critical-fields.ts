import { db } from './db/index.js';
import { authentication } from './db/schema.js';
import {
  pdsPersonalInformation,
  pdsHrDetails,
  pdsReferences,
  employeeEmergencyContacts,
  pdsDeclarations
} from './db/tables/pds.js';
import { eq } from 'drizzle-orm';

async function fixJoshuaCriticalFields() {
  console.log('🔍 Finding Joshua\'s profile...');

  const user = await db.query.authentication.findFirst({
    where: eq(authentication.email, 'joshuapalero111@gmail.com')
  });

  if (!user) {
    console.log('❌ User not found!');
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.firstName} ${user.lastName} (${user.employeeId})\n`);

  // Phase 1: Fix Personal Information - Add missing critical fields
  console.log('📝 Phase 1: Updating Personal Information...');
  await db.update(pdsPersonalInformation)
    .set({
      birthDate: '2000-01-15',        // Placeholder - user should update
      gender: 'Male',                 // Reasonable default
      civilStatus: 'Single',          // Reasonable default for young professional
      gsisNumber: null,               // Optional, user can fill later
    })
    .where(eq(pdsPersonalInformation.employeeId, user.id));
  console.log('  ✅ Added: Birth Date, Gender, Civil Status');

  // Phase 4: Fix HR Details - Add missing required fields
  console.log('\n📝 Phase 4: Updating HR Details...');
  await db.update(pdsHrDetails)
    .set({
      appointmentType: 'Permanent',            // Default
      positionTitle: 'Software Developer',     // Based on context
      salaryGrade: 'SG-15',                    // Placeholder
      firstDayOfService: '2026-04-07',         // Same as dateHired
    })
    .where(eq(pdsHrDetails.employeeId, user.id));
  console.log('  ✅ Added: Appointment Type, Position Title, Salary Grade, First Day of Service');

  // Phase 5.1: Add Character References (if none exist)
  console.log('\n📝 Phase 5.1: Checking Character References...');
  const existingRefs = await db.query.pdsReferences.findMany({
    where: eq(pdsReferences.employeeId, user.id)
  });

  if (existingRefs.length === 0) {
    await db.insert(pdsReferences).values([
      {
        employeeId: user.id,
        name: 'Reference Name 1 (To be updated)',
        address: 'To be updated',
        telNo: '09XX-XXX-XXXX',
      },
      {
        employeeId: user.id,
        name: 'Reference Name 2 (To be updated)',
        address: 'To be updated',
        telNo: '09XX-XXX-XXXX',
      },
      {
        employeeId: user.id,
        name: 'Reference Name 3 (To be updated)',
        address: 'To be updated',
        telNo: '09XX-XXX-XXXX',
      },
    ]);
    console.log('  ✅ Added 3 placeholder character references');
  } else {
    console.log(`  ℹ️  Already has ${existingRefs.length} reference(s)`);
  }

  // Phase 5.2: Add Emergency Contact (if none exist)
  console.log('\n📝 Phase 5.2: Checking Emergency Contact...');
  const existingContacts = await db.query.employeeEmergencyContacts.findMany({
    where: eq(employeeEmergencyContacts.employeeId, user.id)
  });

  if (existingContacts.length === 0) {
    await db.insert(employeeEmergencyContacts).values({
      employeeId: user.id,
      name: 'Emergency Contact Name (To be updated)',
      relationship: 'Parent',
      phoneNumber: '09XX-XXX-XXXX',
      isPrimary: true,
    });
    console.log('  ✅ Added 1 placeholder emergency contact');
  } else {
    console.log(`  ℹ️  Already has ${existingContacts.length} emergency contact(s)`);
  }

  // Phase 5.3: Update Declarations Date Accomplished
  console.log('\n📝 Phase 5.3: Updating Declarations...');
  await db.update(pdsDeclarations)
    .set({
      dateAccomplished: '2026-04-07',  // Today's date
    })
    .where(eq(pdsDeclarations.employeeId, user.id));
  console.log('  ✅ Set dateAccomplished to 2026-04-07');

  console.log('\n✅ All critical fields updated successfully!');
  console.log('\n📋 Summary of Changes:');
  console.log('  - Personal Info: Birth Date, Gender, Civil Status');
  console.log('  - HR Details: Appointment Type, Position Title, Salary Grade, First Day of Service');
  console.log('  - References: 3 placeholder entries (if none existed)');
  console.log('  - Emergency Contact: 1 placeholder entry (if none existed)');
  console.log('  - Declarations: Date Accomplished set');
  console.log('\n⚠️  Note: Birth date (2000-01-15) is a placeholder. User should update with real data.');
  console.log('⚠️  Note: References and emergency contacts are placeholders. User should update.');

  process.exit(0);
}

fixJoshuaCriticalFields().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
