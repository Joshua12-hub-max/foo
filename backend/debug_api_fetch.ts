import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function debugApiFetch() {
  const baseUrl = 'http://localhost:5000/api'; // Adjust if different
  console.log('Testing API fetch from:', baseUrl);

  try {
    // Note: This requires a valid token if verifyToken middleware is active
    // For local debug, we might want to bypass it or use a test token
    console.log('Fetching shift templates...');
    const response = await axios.get(`${baseUrl}/schedules/shift-templates`);
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error('API Fetch Error:', error.message);
    if (error.response) {
      console.error('Error Response Data:', error.response.data);
    }
  }
}

debugApiFetch();
