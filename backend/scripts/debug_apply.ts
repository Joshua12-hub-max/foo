
import axios from 'axios';
import db from '../db/connection.js';

const debugApply = async () => {
    try {
        console.log('Fetching a valid Job ID...');
        const [jobs] = await db.query('SELECT id FROM recruitment_jobs WHERE status = "Open" LIMIT 1');
        
        if (!jobs || (jobs as any[]).length === 0) {
            console.error('No open jobs found to apply to');
            process.exit(1);
        }

        const jobId = (jobs as any[])[0].id;
        console.log(`Using Job ID: ${jobId}`);

        const formData = {
            job_id: jobId,
            first_name: 'Debug',
            last_name: 'Tester',
            email: 'debug@test.com',
            phone_number: '1234567890',
            address: '123 Debug Lane',
            education: 'Debug University',
            experience: 'Debug Experience',
            skills: 'Debugging',
            // resume is optional now
        };

        console.log('Sending request to http://localhost:5000/api/recruitment/apply...');
        const response = await axios.post('http://localhost:5000/api/recruitment/apply', formData);
        
        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);

    } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused! Is the server running on port 5000?');
        } else if (error.response) {
            console.error('Server Error Response:');
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    } finally {
        process.exit();
    }
};

debugApply();
