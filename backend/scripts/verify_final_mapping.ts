
import axios from 'axios';

async function verifyFinalMapping() {
  console.log('--- Verifying Final Backend Mapping ---');
  
  try {
    // Note: This requires the server to be running on localhost:5000
    const response = await axios.get('http://localhost:5000/api/auth/hired-applicant-search', {
      params: { firstName: 'Juano', lastName: 'Parengin' }
    });
    
    const data = response.data.data;
    console.log('Search Result Sample:');
    console.log(JSON.stringify(data, null, 2));
    
    const expectedFields = [
      'gsisNumber', 'pagibigNumber', 'philhealthNumber', 'umidNumber', 'philsysId', 'tinNumber',
      'schoolName', 'course', 'yearGraduated', 'education', 'emergencyContact', 'emergencyContactNumber'
    ];
    
    let allFound = true;
    expectedFields.forEach(field => {
      if (data && field in data) {
        console.log(`✅ Field ${field} found`);
      } else {
        console.error(`❌ Field ${field} MISSING in response!`);
        allFound = false;
      }
    });
    
    if (allFound) {
      console.log('\nSUCCESS: All fields are correctly mapped in backend response.');
    } else {
      console.log('\nFAILURE: Some fields are missing.');
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? (error as Error).message : String(error);
    console.error('Error during verification:', errorMessage);
    console.log('Ensure the backend server is running on http://localhost:5000');
  }
}

verifyFinalMapping();
