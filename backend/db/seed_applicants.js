import db from './connection.js';

const seedApplicants = async () => {
    try {
        console.log('Seeding dummy applicants...');
        
        // Check if jobs exist
        const [jobs] = await db.query("SELECT id FROM recruitment_jobs LIMIT 1");
        let jobId = null;
        if (jobs.length > 0) {
            jobId = jobs[0].id;
        }

        const applicants = [];
        for (let i = 1; i <= 15; i++) {
            applicants.push([
                jobId,
                `Test${i}`,
                `Applicant${i}`,
                `test${i}@example.com`,
                `1234567890`,
                `resume_${i}.pdf`,
                'Applied',
                i % 2 === 0 ? 'email' : 'web',
                i % 2 === 0 ? 'Application for Job' : null,
                i % 2 === 0 ? new Date() : null
            ]);
        }

        await db.query(`
            INSERT INTO recruitment_applicants 
            (job_id, first_name, last_name, email, phone_number, resume_path, status, source, email_subject, email_received_at) 
            VALUES ?
        `, [applicants]);

        console.log('Seeded 15 applicants');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding applicants:', err);
        process.exit(1);
    }
};

seedApplicants();
