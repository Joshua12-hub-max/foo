
import axios from 'axios';
import db from '../db/connection.js';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data'; // Use form-data package for node

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

        // Create a dummy file
        const dummyFilePath = path.join(__dirname, 'dummy_resume.pdf');
        fs.writeFileSync(dummyFilePath, 'dummy pdf content');

        const form = new FormData();
        form.append('job_id', jobId);
        form.append('first_name', 'Debug');
        form.append('last_name', 'Uploader');
        form.append('email', 'uploader@test.com');
        form.append('phone_number', '1234567890');
        form.append('address', '123 Upload St');
        form.append('education', 'Upload Univ');
        form.append('experience', 'Uploading things');
        form.append('skills', 'File handling');
        form.append('resume', fs.createReadStream(dummyFilePath));

        console.log('Sending multipart request with file...');
        const response = await axios.post('http://localhost:5000/api/recruitment/apply', form, {
            headers: {
                ...form.getHeaders()
            }
        });
        
        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);
        
        // Cleanup
        fs.unlinkSync(dummyFilePath);

    } catch (error: any) {
         if (error.response) {
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
