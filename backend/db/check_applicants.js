import db from './connection.js';

const checkApplicants = async () => {
    try {
        const [rows] = await db.query("SELECT COUNT(*) as count FROM recruitment_applicants");
        console.log('Applicant count:', rows[0].count);
        
        if (rows[0].count > 0) {
            const [applicants] = await db.query("SELECT * FROM recruitment_applicants LIMIT 5");
            console.log('Sample applicants:', applicants);
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error checking applicants:', err);
        process.exit(1);
    }
};

checkApplicants();
