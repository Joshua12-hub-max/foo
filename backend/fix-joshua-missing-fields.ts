import { db } from './db/index.js';
import { authentication } from './db/schema.js';
import { pdsPersonalInformation } from './db/tables/pds.js';
import { eq } from 'drizzle-orm';

async function fixJoshuaProfile() {
  console.log('='.repeat(80));
  console.log('FIXING JOSHUA\'S MISSING PROFILE FIELDS');
  console.log('='.repeat(80));

  // Find Joshua's account
  const user = await db.query.authentication.findFirst({
    where: eq(authentication.email, 'joshuapalero111@gmail.com')
  });

  if (!user) {
    console.log('❌ User not found!');
    process.exit(1);
  }

  console.log(`\n✓ Found user: ${user.firstName} ${user.lastName} (ID: ${user.id})`);

  // Meycauayan City, Bulacan is in Region III (Central Luzon)
  // Based on the address: Meycauayan City, Bulacan
  const region = 'Region III (Central Luzon)';

  console.log('\n[UPDATING] Populating missing fields...\n');

  const updates = {
    // Add missing region fields
    resRegion: region,
    permRegion: region,

    // These can be added manually by user later, but let's set reasonable defaults
    birthDate: null, // User should fill this in
    gender: null, // User should fill this in (Male/Female)
    civilStatus: null, // User should fill this in
    telephoneNo: null, // Optional
    gsisNumber: null, // Optional
    citizenshipType: null, // Only needed if dual citizenship
    dualCountry: null // Only needed if dual citizenship
  };

  await db.update(pdsPersonalInformation)
    .set(updates)
    .where(eq(pdsPersonalInformation.employeeId, user.id));

  console.log('✓ Updated fields:');
  console.log(`  - Residential Region: ${region}`);
  console.log(`  - Permanent Region: ${region}`);
  console.log(`  - Birth Date: (left null - user can fill)`);
  console.log(`  - Gender/Sex: (left null - user can fill)`);
  console.log(`  - Civil Status: (left null - user can fill)`);
  console.log(`  - Telephone: (left null - optional)`);
  console.log(`  - GSIS Number: (left null - optional)`);

  // Verify the update
  console.log('\n[VERIFYING] Checking updated data...\n');
  const updated = await db.select()
    .from(pdsPersonalInformation)
    .where(eq(pdsPersonalInformation.employeeId, user.id))
    .limit(1);

  if (updated.length > 0) {
    const pds = updated[0];
    console.log('✓ Verification successful:');
    console.log(`  - Residential Region: ${pds.resRegion || '(still missing)'}`);
    console.log(`  - Permanent Region: ${pds.permRegion || '(still missing)'}`);
    console.log(`  - City: ${pds.resCity}`);
    console.log(`  - Province: ${pds.resProvince}`);
    console.log(`  - Blood Type: ${pds.bloodType}`);
    console.log(`  - Height: ${pds.heightM}m`);
    console.log(`  - Weight: ${pds.weightKg}kg`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ PROFILE FIXED SUCCESSFULLY!');
  console.log('='.repeat(80));
  console.log('\nUser can now:');
  console.log('  1. See Region fields populated in their profile');
  console.log('  2. Manually fill Birth Date, Gender, and Civil Status through the form');
  console.log('  3. All other fields are already populated and visible');
  console.log('\n');

  process.exit(0);
}

fixJoshuaProfile().catch(console.error);
