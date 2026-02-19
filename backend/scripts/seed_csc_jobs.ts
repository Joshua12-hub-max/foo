
import { db } from '../db/index.js';
import { recruitmentJobs } from '../db/schema.js';

const cscJobs = [
  {
    title: "Administrative Officer I",
    department: "Administrative Services",
    description: "Performs professional level work in the administration of management programs.",
    requirements: `Education: Bachelor's degree relevant to the job
Experience: None required
Training: None required
Eligibility: Career Service (Professional) Second Level Eligibility`
  },
  {
    title: "Administrative Assistant II",
    department: "Administrative Services",
    description: "Performs clerical and secretarial duties.",
    requirements: `Education: Completion of two years studies in college
Experience: 1 year of relevant experience
Training: 4 hours of relevant training
Eligibility: Career Service (Subprofessional) First Level Eligibility`
  },
  {
    title: "Project Development Officer I",
    department: "Planning and Development",
    description: "Assists in the formulation of development projects.",
    requirements: `Education: Bachelor's degree relevant to the job
Experience: None required
Training: None required
Eligibility: Career Service (Professional) Second Level Eligibility`
  },
  {
    title: "Information Technology Officer I",
    department: "Management Information Systems",
    description: "Supervises the maintenance of IT systems.",
    requirements: `Education: Bachelor's degree relevant to the job
Experience: 2 years of relevant experience
Training: 8 hours of relevant training
Eligibility: Career Service (Professional) Second Level Eligibility`
  },
  {
    title: "Computer Programmer II",
    department: "Management Information Systems",
    description: "Develops and maintains software applications.",
    requirements: `Education: Bachelor's degree relevant to the job
Experience: 1 year of relevant experience
Training: 4 hours of relevant training
Eligibility: Career Service (Professional) Second Level Eligibility`
  },
  {
    title: "Accountant III",
    department: "Accounting Office",
    description: "Supervises the preparation of financial statements.",
    requirements: `Education: Bachelor's degree in Commerce/Business Administration major in Accounting
Experience: 2 years of relevant experience
Training: 8 hours of relevant training
Eligibility: RA 1080 (CPA)`
  },
  {
    title: "Nurse I",
    department: "City Health Office",
    description: "Provides nursing care to patients.",
    requirements: `Education: Bachelor of Science in Nursing
Experience: None required
Training: None required
Eligibility: RA 1080 (Nurse)`
  },
  {
    title: "Engineer II",
    department: "City Engineering Office",
    description: "Performs civil engineering work.",
    requirements: `Education: Bachelor's degree in Engineering
Experience: 1 year of relevant experience
Training: 4 hours of relevant training
Eligibility: RA 1080 (Engineer)`
  },
  {
    title: "Human Resource Management Officer I",
    department: "HRMO",
    description: "Assists in the implementation of HR policies.",
    requirements: `Education: Bachelor's degree relevant to the job
Experience: None required
Training: None required
Eligibility: Career Service (Professional) Second Level Eligibility`
  },
  {
    title: "Budget Officer I",
    department: "Budget Office",
    description: "Assists in the preparation of the budget.",
    requirements: `Education: Bachelor's degree relevant to the job
Experience: None required
Training: None required
Eligibility: Career Service (Professional) Second Level Eligibility`
  },
  {
    title: "Planning Officer II",
    department: "Planning and Development",
    description: "Participates in the formulation of development plans.",
    requirements: `Education: Bachelor's degree relevant to the job
Experience: 1 year of relevant experience
Training: 4 hours of relevant training
Eligibility: Career Service (Professional) Second Level Eligibility`
  },
  {
    title: "Records Officer I",
    department: "Administrative Services",
    description: "Maintains official records and documents.",
    requirements: `Education: Bachelor's degree relevant to the job
Experience: None required
Training: None required
Eligibility: Career Service (Professional) Second Level Eligibility`
  },
  {
    title: "Supply Officer II",
    department: "General Services Office",
    description: "Supervises the procurement and distribution of supplies.",
    requirements: `Education: Bachelor's degree relevant to the job
Experience: 1 year of relevant experience
Training: 4 hours of relevant training
Eligibility: Career Service (Professional) Second Level Eligibility`
  },
  {
    title: "Cashier I",
    department: "Treasury Office",
    description: "Receives and disburses funds.",
    requirements: `Education: Bachelor's degree relevant to the job
Experience: None required
Training: None required
Eligibility: Career Service (Professional) Second Level Eligibility`
  },
  {
    title: "Utility Worker I",
    department: "General Services Office",
    description: "Performs janitorial and messengerial duties.",
    requirements: `Education: Must be able to read and write
Experience: None required
Training: None required
Eligibility: None required (MC 11, s. 1996 - Cat. III)`
  },
  {
    title: "Driver II",
    department: "General Services Office",
    description: "Drives and maintains government vehicles.",
    requirements: `Education: Elementary School Graduate
Experience: None required
Training: None required
Eligibility: Professional Driver's License (MC 11, s. 1996 - Cat. II)`
  },
  {
    title: "Security Guard II",
    department: "General Services Office",
    description: "Guards government property and premises.",
    requirements: `Education: High School Graduate
Experience: 1 year of relevant experience
Training: 4 hours of relevant training
Eligibility: Security Guard License (MC 11, s. 1996 - Cat. II)`
  },
  {
    title: "Data Entry Machine Operator II",
    department: "Management Information Systems",
    description: "Encodes data into computer systems.",
    requirements: `Education: Completion of two years studies in college
Experience: 1 year of relevant experience
Training: 4 hours of relevant training
Eligibility: Career Service (Subprofessional) First Level Eligibility`
  },
  {
    title: "Clerk III",
    department: "Administrative Services",
    description: "Performs difficult clerical work.",
    requirements: `Education: Completion of two years studies in college
Experience: 1 year of relevant experience
Training: 4 hours of relevant training
Eligibility: Career Service (Subprofessional) First Level Eligibility`
  },
  {
    title: "Attorney III",
    department: "Legal Office",
    description: "Provides legal advice and representation.",
    requirements: `Education: Bachelor of Laws
Experience: 1 year of relevant experience
Training: 4 hours of relevant training
Eligibility: RA 1080 (Bar)`
  }
];

const seedCSCJobs = async () => {
  console.log('Seeding CSC Qualification Standards Jobs...');
  try {
    for (const job of cscJobs) {
      await db.insert(recruitmentJobs).values({
        title: job.title,
        department: job.department,
        job_description: job.description,
        requirements: job.requirements,
        employment_type: 'Full-time',
        status: 'Open',
        posted_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      });
    }
    console.log(`Successfully seeded ${cscJobs.length} jobs.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding jobs:', error);
    process.exit(1);
  }
};

seedCSCJobs();
