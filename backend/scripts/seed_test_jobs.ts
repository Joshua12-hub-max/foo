import 'dotenv/config';
import { db } from '../db/index.js';
import { recruitmentJobs } from '../db/schema.js';

const SEED_JOBS = [
  // ---------------------------------------------
  // STANDARD DUTY JOBS (Require IDs, CSC, Education)
  // ---------------------------------------------
  {
    title: 'Senior Software Engineer (System Validated - Standard)',
    department: 'IT Department',
    job_description: 'Develop and maintain the core HR systems. This job requires full validation of Government IDs, Civil Service Eligibility, and Education/Experience metrics.',
    requirements: 'BS Computer Science, 5+ years experience',
    employment_type: 'Permanent' as const, // Permanent = Standard
    location: 'Main Office',
    status: 'Open' as const,
    require_civil_service: true,
    require_government_ids: true,
    require_education_experience: true
  },
  {
    title: 'City Planning Officer (System Validated - Standard)',
    department: 'Planning Office',
    job_description: 'Strategic city planning and urban development. Strictly requires authorized IDs.',
    requirements: 'BS Architecture/Engineering, Civil Service Professional',
    employment_type: 'Full-time' as const, // Full-time = Standard
    location: 'City Hall',
    status: 'Open' as const,
    require_civil_service: true,
    require_government_ids: true,
    require_education_experience: true
  },

  // ---------------------------------------------
  // IRREGULAR DUTY JOBS (No strict validations required)
  // ---------------------------------------------
  {
    title: 'Data Encoding Specialist (System Validated - Irregular)',
    department: 'Records Management',
    job_description: 'Data entry and digital archiving of records for specific short projects. Government IDs and CSC Eligibility are optional.',
    requirements: 'High School Diploma, Computer Literate',
    employment_type: 'Job Order' as const, // Job Order = Irregular
    location: 'Main Office',
    status: 'Open' as const,
    require_civil_service: false,
    require_government_ids: false,
    require_education_experience: false
  },
  {
    title: 'Events Coordinator (System Validated - Irregular)',
    department: 'Public Information',
    job_description: 'Coordinate city events. Government IDs and CSC Eligibility are optional.',
    requirements: 'BS Communication Arts, Flexible hours',
    employment_type: 'Part-time' as const, // Part-time = Irregular
    location: 'City Hall',
    status: 'Open' as const,
    require_civil_service: false,
    require_government_ids: false,
    require_education_experience: false
  }
];

async function seedData() {
  console.log('Seeding 4 test jobs (2 Standard, 2 Irregular)...');
  
  const jobIds = [];
  for (const job of SEED_JOBS) {
    const [result] = await db.insert(recruitmentJobs).values(job);
    jobIds.push(result.insertId);
  }

  console.log('✅ Jobs seeded successfully!');
  console.log(`\nStandard Jobs (Full Validations Required):`);
  console.log(`- ID: ${jobIds[0]} | ${SEED_JOBS[0].title}`);
  console.log(`- ID: ${jobIds[1]} | ${SEED_JOBS[1].title}`);
  
  console.log(`\nIrregular Jobs (No Strict Validations):`);
  console.log(`- ID: ${jobIds[2]} | ${SEED_JOBS[2].title}`);
  console.log(`- ID: ${jobIds[3]} | ${SEED_JOBS[3].title}`);
  
  process.exit(0);
}

seedData().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
