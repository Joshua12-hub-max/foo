import db from './connection.js';

const seedJobs = async () => {
    try {
        console.log('Seeding jobs...');

        // 1. Get an Admin User to be the "poster"
        const [users] = await db.query("SELECT id FROM authentication WHERE role = 'admin' LIMIT 1");
        
        let posterId = null;
        if (users.length > 0) {
            posterId = users[0].id;
        } else {
            console.log('No admin found. Using NULL for posted_by (or creating a dummy one if constraint exists).');
            // Check if we have any user
            const [anyUser] = await db.query("SELECT id FROM authentication LIMIT 1");
            if (anyUser.length > 0) posterId = anyUser[0].id;
        }

        console.log(`Using poster_id: ${posterId}`);

        // 2. Sample Jobs
        const jobs = [
            {
                title: "Administrative Assistant",
                department: "HR",
                job_description: "We are looking for a responsible Administrative Assistant to perform a variety of administrative and clerical tasks. Duties of the Administrative Assistant include providing support to our managers and employees, assisting in daily office needs and managing our company's general administrative activities.",
                requirements: "- Proven experience as an administrative assistant\n- Knowledge of office management systems and procedures\n- Proficiency in MS Office (MS Excel and MS PowerPoint, in particular)\n- Excellent time management skills and the ability to prioritize work\n- Attention to detail and problem solving skills",
                salary_range: "₱18,000 - ₱22,000",
                location: "City Hall, Meycauayan",
                employment_type: "Full-time",
                status: "Open",
                application_email: "hr@meycauayan.gov.ph"
            },
            {
                title: "IT Support Specialist",
                department: "IT",
                job_description: "We are looking for a competent IT Help Desk Technician to provide fast and useful technical assistance on computer systems. You will answer queries on basic technical issues and offer advice to solve them.",
                requirements: "- Proven experience as a help desk technician or other customer support role\n- Tech savvy with working knowledge of office automation products, databases and remote control\n- Good understanding of computer systems, mobile devices and other tech products\n- Ability to diagnose and resolve basic technical issues",
                salary_range: "₱25,000 - ₱30,000",
                location: "City Hall, Meycauayan",
                employment_type: "Contractual",
                status: "Open",
                application_email: "it@meycauayan.gov.ph"
            },
            {
                title: "Civil Engineer",
                department: "Engineering",
                job_description: "We are looking for an innovative Civil Engineer to design, develop and construct a huge range of projects of the physically and naturally built environment from conception through to completion.",
                requirements: "- Proven working experience in civil engineering\n- Excellent knowledge of design and visualizations software such as AutoCAD,Civil 3D or similar\n- Proficiency in site layout, grading, utility design, erosion control, regulatory approvals etc\n- Project management and supervision skills",
                salary_range: "₱35,000 - ₱45,000",
                location: "Engineering Office",
                employment_type: "Full-time",
                status: "Open",
                application_email: "engineering@meycauayan.gov.ph"
            }
        ];

        // 3. Insert Jobs
        for (const job of jobs) {
            // Check if exists
            const [existing] = await db.query("SELECT id FROM recruitment_jobs WHERE title = ?", [job.title]);
            if (existing.length === 0) {
                await db.query(
                    `INSERT INTO recruitment_jobs 
                    (title, department, job_description, requirements, salary_range, location, employment_type, status, application_email, posted_by, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [job.title, job.department, job.job_description, job.requirements, job.salary_range, job.location, job.employment_type, job.status, job.application_email, posterId]
                );
                console.log(`Inserted: ${job.title}`);
            } else {
                console.log(`Skipped (already exists): ${job.title}`);
            }
        }

        console.log('Job seeding completed!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedJobs();
