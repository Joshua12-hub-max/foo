
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth/login';
const CREDENTIALS = {
  identifier: 'capstone682@gmail.com',
  password: '12345'
};

const testLogin = async () => {
    try {
        console.log(`Attempting login to ${API_URL}`);
        console.log('Credentials:', CREDENTIALS);

        const response = await axios.post(API_URL, CREDENTIALS);
        
        console.log('Login Result:', response.status, response.statusText);
        console.log('Data:', response.data);
        console.log('SUCCESS ✅ - The API is accepting the credentials.');
    } catch (error: any) {
        if (error.response) {
            console.log('Login Failed ❌');
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
};

testLogin();
