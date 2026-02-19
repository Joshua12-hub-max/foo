
import { db } from '../db/index.js';
import { qualificationStandards } from '../db/tables/plantilla.js'; // Correct import path based on previous check
import { eq } from 'drizzle-orm';

const qsData = [
  {
    positionTitle: "Administrative Officer I",
    salaryGrade: 11,
    educationRequirement: "Bachelor's degree relevant to the job",
    experienceYears: 0,
    trainingHours: 0,
    eligibilityRequired: "Career Service (Professional) Second Level Eligibility",
    isActive: 1
  },
  {
    positionTitle: "Administrative Assistant II",
    salaryGrade: 8,
    educationRequirement: "Completion of two years studies in college",
    experienceYears: 1,
    trainingHours: 4,
    eligibilityRequired: "Career Service (Subprofessional) First Level Eligibility",
    isActive: 1
  },
  {
    positionTitle: "Project Development Officer I",
    salaryGrade: 11,
    educationRequirement: "Bachelor's degree relevant to the job",
    experienceYears: 0,
    trainingHours: 0,
    eligibilityRequired: "Career Service (Professional) Second Level Eligibility",
    isActive: 1
  },
  {
    positionTitle: "Information Technology Officer I",
    salaryGrade: 19,
    educationRequirement: "Bachelor's degree relevant to the job",
    experienceYears: 2,
    trainingHours: 8,
    eligibilityRequired: "Career Service (Professional) Second Level Eligibility",
    isActive: 1
  },
  {
    positionTitle: "Computer Programmer II",
    salaryGrade: 15,
    educationRequirement: "Bachelor's degree relevant to the job",
    experienceYears: 1,
    trainingHours: 4,
    eligibilityRequired: "Career Service (Professional) Second Level Eligibility",
    isActive: 1
  },
  {
    positionTitle: "Accountant III",
    salaryGrade: 19,
    educationRequirement: "Bachelor's degree in Commerce/Business Administration major in Accounting",
    experienceYears: 2,
    trainingHours: 8,
    eligibilityRequired: "RA 1080 (CPA)",
    isActive: 1
  },
  {
    positionTitle: "Nurse I",
    salaryGrade: 15,
    educationRequirement: "Bachelor of Science in Nursing",
    experienceYears: 0,
    trainingHours: 0,
    eligibilityRequired: "RA 1080 (Nurse)",
    isActive: 1
  },
  {
    positionTitle: "Engineer II",
    salaryGrade: 16,
    educationRequirement: "Bachelor's degree in Engineering",
    experienceYears: 1,
    trainingHours: 4,
    eligibilityRequired: "RA 1080 (Engineer)",
    isActive: 1
  },
  {
    positionTitle: "Human Resource Management Officer I",
    salaryGrade: 11,
    educationRequirement: "Bachelor's degree relevant to the job",
    experienceYears: 0,
    trainingHours: 0,
    eligibilityRequired: "Career Service (Professional) Second Level Eligibility",
    isActive: 1
  },
  {
    positionTitle: "Budget Officer I",
    salaryGrade: 11,
    educationRequirement: "Bachelor's degree relevant to the job",
    experienceYears: 0,
    trainingHours: 0,
    eligibilityRequired: "Career Service (Professional) Second Level Eligibility",
    isActive: 1
  },
  {
    positionTitle: "Planning Officer II",
    salaryGrade: 15,
    educationRequirement: "Bachelor's degree relevant to the job",
    experienceYears: 1,
    trainingHours: 4,
    eligibilityRequired: "Career Service (Professional) Second Level Eligibility",
    isActive: 1
  },
  {
    positionTitle: "Records Officer I",
    salaryGrade: 10,
    educationRequirement: "Bachelor's degree relevant to the job",
    experienceYears: 0,
    trainingHours: 0,
    eligibilityRequired: "Career Service (Professional) Second Level Eligibility",
    isActive: 1
  },
  {
    positionTitle: "Supply Officer II",
    salaryGrade: 14,
    educationRequirement: "Bachelor's degree relevant to the job",
    experienceYears: 1,
    trainingHours: 4,
    eligibilityRequired: "Career Service (Professional) Second Level Eligibility",
    isActive: 1
  },
  {
    positionTitle: "Cashier I",
    salaryGrade: 10,
    educationRequirement: "Bachelor's degree relevant to the job",
    experienceYears: 0,
    trainingHours: 0,
    eligibilityRequired: "Career Service (Professional) Second Level Eligibility",
    isActive: 1
  },
  {
    positionTitle: "Utility Worker I",
    salaryGrade: 1,
    educationRequirement: "Must be able to read and write",
    experienceYears: 0,
    trainingHours: 0,
    eligibilityRequired: "None required (MC 11, s. 1996 - Cat. III)",
    isActive: 1
  },
  {
    positionTitle: "Driver II",
    salaryGrade: 4,
    educationRequirement: "Elementary School Graduate",
    experienceYears: 0,
    trainingHours: 0,
    eligibilityRequired: "Professional Driver's License (MC 11, s. 1996 - Cat. II)",
    isActive: 1
  },
  {
    positionTitle: "Security Guard II",
    salaryGrade: 5,
    educationRequirement: "High School Graduate",
    experienceYears: 1,
    trainingHours: 4,
    eligibilityRequired: "Security Guard License (MC 11, s. 1996 - Cat. II)",
    isActive: 1
  },
  {
    positionTitle: "Data Entry Machine Operator II",
    salaryGrade: 8,
    educationRequirement: "Completion of two years studies in college",
    experienceYears: 1,
    trainingHours: 4,
    eligibilityRequired: "Career Service (Subprofessional) First Level Eligibility",
    isActive: 1
  },
  {
    positionTitle: "Clerk III",
    salaryGrade: 6,
    educationRequirement: "Completion of two years studies in college",
    experienceYears: 1,
    trainingHours: 4,
    eligibilityRequired: "Career Service (Subprofessional) First Level Eligibility",
    isActive: 1
  },
  {
    positionTitle: "Attorney III",
    salaryGrade: 21,
    educationRequirement: "Bachelor of Laws",
    experienceYears: 1,
    trainingHours: 4,
    eligibilityRequired: "RA 1080 (Bar)",
    isActive: 1
  }
];

const seedQS = async () => {
    console.log('Seeding Qualification Standards...');
    try {
        let count = 0;
        for (const qs of qsData) {
            // Check for duplicates based on position and salary grade (as per unique constraint)
            const existing = await db.select().from(qualificationStandards)
                .where(eq(qualificationStandards.positionTitle, qs.positionTitle))
                .limit(1);

            if (existing.length === 0) {
                await db.insert(qualificationStandards).values(qs);
                count++;
            }
        }
        console.log(`Successfully seeded ${count} new Qualification Standards.`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding QS:', error);
        process.exit(1);
    }
};

seedQS();
