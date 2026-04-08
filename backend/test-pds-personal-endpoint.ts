import { db } from './db/index.js';
import { authentication, pdsPersonalInformation } from './db/schema.js';
import { eq, sql } from 'drizzle-orm';

async function testPdsPersonalEndpoint() {
  console.log('🔍 Testing PDS Personal Information Endpoint Logic...\n');

  const user = await db.query.authentication.findFirst({
    where: eq(authentication.email, 'joshuapalero111@gmail.com')
  });

  if (!user) {
    console.log('❌ User not found!');
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.firstName} ${user.lastName} (ID: ${user.id})\n`);

  // Test the exact query used by getPdsPersonal
  console.log('Testing query used by getPdsPersonal endpoint:');
  console.log(`  SELECT * FROM pds_personal_information WHERE employee_id = ${user.id}\n`);

  const rows = await db.select().from(pdsPersonalInformation).where(sql`employee_id = ${user.id}`);

  if (rows.length === 0) {
    console.log('❌ No rows returned! The query is not finding the data.\n');

    console.log('Let\'s try with eq() instead:');
    const rows2 = await db.select().from(pdsPersonalInformation).where(eq(pdsPersonalInformation.employeeId, user.id));

    if (rows2.length > 0) {
      console.log(`✅ Found ${rows2.length} row(s) using eq()!\n`);
      console.log('📋 Data returned:');
      console.log(JSON.stringify(rows2[0], null, 2));
      console.log('\n⚠️  PROBLEM FOUND: The sql template query is not working correctly!');
      console.log('The controller needs to use eq() instead of sql``\n');
    } else {
      console.log('❌ Still no rows. The data might not exist in the table.');
    }
  } else {
    console.log(`✅ Found ${rows.length} row(s)!\n`);
    console.log('📋 Data returned:');
    const data = rows[0];
    console.log(`  - Birth Date: ${data.birthDate}`);
    console.log(`  - Gender: ${data.gender}`);
    console.log(`  - Civil Status: ${data.civilStatus}`);
    console.log(`  - Blood Type: ${data.bloodType}`);
    console.log(`  - PhilSys ID: ${data.philsysId}`);
    console.log(`  - GSIS Number: ${data.gsisNumber}`);
    console.log(`  - Residential Region: ${data.resRegion}`);
    console.log(`  - Residential Province: ${data.resProvince}`);
    console.log(`  - Residential City: ${data.resCity}`);
    console.log(`  - Residential Barangay: ${data.resBarangay}`);
    console.log('\n✅ The endpoint query is working correctly!');
  }

  process.exit(0);
}

testPdsPersonalEndpoint().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
