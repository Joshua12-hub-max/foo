import 'dotenv/config';
import { db } from '../db/index.js';
import { recruitmentJobs, recruitmentApplicants } from '../db/schema.js';

const SEED_JOBS = [
  {
    title: 'Senior Software Engineer',
    department: 'IT Department',
    job_description: 'Develop and maintain the core HR systems with standard requirements.',
    requirements: 'BS Computer Science, 5+ years experience',
    employment_type: 'Permanent' as const,
    location: 'Main Office',
    status: 'Open' as const,
  },
  {
    title: 'City Planning Officer',
    department: 'Planning Office',
    job_description: 'Strategic city planning and urban development.',
    requirements: 'BS Architecture/Engineering, Civil Service Professional',
    employment_type: 'Full-time' as const,
    location: 'City Hall',
    status: 'Open' as const,
  },
  {
    title: 'Data Encoding Specialist',
    department: 'Records Management',
    job_description: 'Data entry and digital archiving of records for specific short projects.',
    requirements: 'High School Diploma, Computer Literate',
    employment_type: 'Job Order' as const,
    location: 'Main Office',
    status: 'Open' as const,
  },
  {
    title: 'Events Coordinator',
    department: 'Public Information',
    job_description: 'Coordinate city events.',
    requirements: 'BS Communication Arts, Flexible hours',
    employment_type: 'Part-time' as const,
    location: 'City Hall',
    status: 'Open' as const,
  }
];

async function seedData() {
  console.log('Seeding 4 test jobs...');
  
  // Insert jobs
  const jobIds = [];
  for (const job of SEED_JOBS) {
    const [result] = await db.insert(recruitmentJobs).values(job);
    jobIds.push(result.insertId);
  }

  console.log(`Successfully created jobs. Standard IDs: [${jobIds[0]}, ${jobIds[1]}], Irregular IDs: [${jobIds[2]}, ${jobIds[3]}]`);

  // Generate 20 applicants (10 for standard, 10 for irregular)
  const applicants = [];

  // Generate 10 standard
  for (let i = 1; i <= 10; i++) {
    const isFirstJob = i <= 5;
    applicants.push({
      job_id: isFirstJob ? jobIds[0] : jobIds[1],
      first_name: 'StandardName' + i,
      last_name: 'Applicant ' + i,
      email: `test${i}_standard@gmail.com`,
      phone_number: '0912345678' + (i % 10),
      stage: 'Hired' as const,
      status: 'Hired' as const,
      birth_date: new Date('1990-01-01').toISOString(),
      sex: i % 2 === 0 ? 'Female' : 'Male' as any,
      civil_status: 'Single' as const,
      address: '123 Standard St, Meycauayan, Bulacan'
    });
  }

  // Generate 10 irregular
  for (let i = 1; i <= 10; i++) {
    const isFirstJob = i <= 5;
    applicants.push({
      job_id: isFirstJob ? jobIds[2] : jobIds[3],
      first_name: 'IrregularName' + i,
      last_name: 'Applicant ' + i,
      email: `test${i}_irregular@gmail.com`,
      phone_number: '0998765432' + (i % 10),
      stage: 'Hired' as const,
      status: 'Hired' as const,
      birth_date: new Date('1995-05-05').toISOString(),
      sex: i % 2 === 0 ? 'Male' : 'Female' as any,
      civil_status: 'Married' as const,
      address: '456 Irregular Ave, Meycauayan, Bulacan'
    });
  }

  console.log('Seeding 20 test applicants...');
  await db.insert(recruitmentApplicants).values(applicants);
  
  console.log('✅ Seeding completed! 20 "Hired" applicants are now available.');
  console.log('You can now log in to the admin portal, click "Register Employee", and check the grids.');
  process.exit(0);
}

seedData().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
