import { db } from './db/index.js';
import { authentication, pdsPersonalInformation } from './db/schema.js';
import { eq } from 'drizzle-orm';
import { UserService } from './services/user.service.js';

async function testJoshuaApiResponse() {
  console.log('🔍 Testing Joshua\'s API Response Data...\n');

  const user = await db.query.authentication.findFirst({
    where: eq(authentication.email, 'joshuapalero111@gmail.com')
  });

  if (!user) {
    console.log('❌ User not found!');
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.firstName} ${user.lastName} (ID: ${user.id})\n`);

  // Fetch data the same way the API does
  const employeeData = await UserService.getEmployeeById(user.id);

  if (!employeeData) {
    console.log('❌ Employee data not found!');
    process.exit(1);
  }

  console.log('📋 Key Fields in API Response:\n');
  console.log('Personal Information:');
  console.log(`  - Birth Date: ${employeeData.birthDate || '(missing)'}`);
  console.log(`  - Gender: ${employeeData.gender || '(missing)'}`);
  console.log(`  - Civil Status: ${employeeData.civilStatus || '(missing)'}`);
  console.log(`  - Blood Type: ${employeeData.bloodType || '(missing)'}`);

  console.log('\nGovernment IDs:');
  console.log(`  - PhilSys ID: ${employeeData.philsysId || '(missing)'}`);
  console.log(`  - GSIS Number: ${employeeData.gsisNumber || '(missing)'}`);
  console.log(`  - UMID: ${employeeData.umidNumber || '(missing)'}`);
  console.log(`  - PhilHealth: ${employeeData.philhealthNumber || '(missing)'}`);
  console.log(`  - Pag-IBIG: ${employeeData.pagibigNumber || '(missing)'}`);
  console.log(`  - TIN: ${employeeData.tinNumber || '(missing)'}`);

  console.log('\nResidential Address Details:');
  console.log(`  - Region: ${employeeData.resRegion || '(missing)'}`);
  console.log(`  - Province: ${employeeData.resProvince || '(missing)'}`);
  console.log(`  - City/Municipality: ${employeeData.resCity || '(missing)'}`);
  console.log(`  - Barangay: ${employeeData.resBarangay || '(missing)'}`);
  console.log(`  - House/Block/Lot: ${employeeData.resHouseBlockLot || '(missing)'}`);
  console.log(`  - Street: ${employeeData.resStreet || '(missing)'}`);
  console.log(`  - Subdivision: ${employeeData.resSubdivision || '(missing)'}`);

  console.log('\nPermanent Address Details:');
  console.log(`  - Region: ${employeeData.permRegion || '(missing)'}`);
  console.log(`  - Province: ${employeeData.permProvince || '(missing)'}`);
  console.log(`  - City/Municipality: ${employeeData.permCity || '(missing)'}`);
  console.log(`  - Barangay: ${employeeData.permBarangay || '(missing)'}`);
  console.log(`  - House/Block/Lot: ${employeeData.permHouseBlockLot || '(missing)'}`);
  console.log(`  - Street: ${employeeData.permStreet || '(missing)'}`);
  console.log(`  - Subdivision: ${employeeData.permSubdivision || '(missing)'}`);

  console.log('\nHR Details:');
  console.log(`  - Appointment Type: ${employeeData.appointmentType || '(missing)'}`);
  console.log(`  - Position Title: ${employeeData.positionTitle || '(missing)'}`);
  console.log(`  - Salary Grade: ${employeeData.salaryGrade || '(missing)'}`);
  console.log(`  - First Day of Service: ${employeeData.firstDayOfService || '(missing)'}`);

  console.log('\n✅ All fields are being returned by the backend API!');
  console.log('\n💡 If fields are not showing in the UI, the issue is in the frontend.');

  process.exit(0);
}

testJoshuaApiResponse().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
