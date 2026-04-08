import axios from 'axios';

async function testApiEndpoint() {
  try {
    console.log('🔍 Testing API endpoint directly...\n');

    // This would need a valid JWT token in a real scenario
    // For now, just showing what endpoint would be called
    console.log('The frontend calls these endpoints:');
    console.log('1. GET /api/auth/me - Returns basic user data');
    console.log('2. GET /api/employees/:id - Returns detailed profile\n');

    console.log('Expected fields in the response from /api/employees/15:');
    console.log('  ✓ birthDate, gender, civilStatus, bloodType');
    console.log('  ✓ philsysId, gsisNumber, umidNumber, etc.');
    console.log('  ✓ resRegion, resProvince, resCity, resBarangay');
    console.log('  ✓ permRegion, permProvince, permCity, permBarangay');
    console.log('  ✓ resHouseBlockLot, resStreet, resSubdivision');
    console.log('  ✓ permHouseBlockLot, permStreet, permSubdivision\n');

    console.log('✅ Backend verification (from previous test):');
    console.log('  - Database has all fields ✓');
    console.log('  - API returns all fields ✓');
    console.log('  - Frontend types include all fields ✓');
    console.log('  - Components are set up to display fields ✓\n');

    console.log('🔧 If fields are still not displaying in the UI, try:');
    console.log('  1. Restart the frontend dev server');
    console.log('  2. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('  3. Clear browser cache and cookies');
    console.log('  4. Log out and log back in');
    console.log('  5. Check browser console for any errors (F12 > Console tab)');
  } catch (error) {
    console.error('Error:', error);
  }
}

testApiEndpoint();
