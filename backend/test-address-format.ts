import { db } from './db/index.js';
import { authentication, pdsPersonalInformation } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function testAddressFormat() {
  console.log('🔍 Checking Address Data Format...\n');

  const user = await db.query.authentication.findFirst({
    where: eq(authentication.email, 'joshuapalero111@gmail.com')
  });

  if (!user) {
    console.log('❌ User not found!');
    process.exit(1);
  }

  const personal = await db.query.pdsPersonalInformation.findFirst({
    where: eq(pdsPersonalInformation.employeeId, user.id)
  });

  if (!personal) {
    console.log('❌ No personal information found!');
    process.exit(1);
  }

  console.log('📍 RESIDENTIAL ADDRESS DATA:');
  console.log(`  Region: "${personal.resRegion}"`);
  console.log(`  Province: "${personal.resProvince}"`);
  console.log(`  City: "${personal.resCity}"`);
  console.log(`  Barangay: "${personal.resBarangay}"`);

  console.log('\n📍 PERMANENT ADDRESS DATA:');
  console.log(`  Region: "${personal.permRegion}"`);
  console.log(`  Province: "${personal.permProvince}"`);
  console.log(`  City: "${personal.permCity}"`);
  console.log(`  Barangay: "${personal.permBarangay}"`);

  console.log('\n🩸 BLOOD TYPE DATA:');
  console.log(`  Blood Type: "${personal.bloodType}"`);

  console.log('\n❗ PROBLEM IDENTIFIED:');
  console.log('The form expects CODES (e.g., "03" for Region), but the database stores NAMES (e.g., "Region III (Central Luzon)")');
  console.log('\nExpected format:');
  console.log('  Region: "03" (code)');
  console.log('  Province: "0314" (code for Bulacan)');
  console.log('  City: "031412" (code for Meycauayan)');
  console.log('  Barangay: Barangay code');
  console.log('\nActual format in database:');
  console.log(`  Region: "${personal.resRegion}" (name)`);
  console.log(`  Province: "${personal.resProvince}" (name)`);
  console.log(`  City: "${personal.resCity}" (name)`);
  console.log(`  Barangay: "${personal.resBarangay}" (name)`);

  console.log('\n🩸 Blood Type Issue:');
  if (personal.bloodType && personal.bloodType.startsWith('0')) {
    console.log('  ⚠️  Blood type starts with zero "0" but form expects letter "O"');
    console.log(`  Database: "${personal.bloodType}"`);
    console.log(`  Expected: "${personal.bloodType.replace(/^0/, 'O')}"`);
  } else {
    console.log('  ✅ Blood type format looks correct');
  }

  process.exit(0);
}

testAddressFormat().catch(console.error);
