import { db } from '../db/index.js';
import { pdsFamily, pdsEducation, pdsEligibility, pdsWorkExperience, pdsLearningDevelopment, pdsOtherInfo, pdsReferences, pdsVoluntaryWork } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function checkSofiaRelatedData() {
  try {
    const userId = 39;
    console.log(`Checking related PDS data for employeeId ${userId}...`);
    
    const tables = {
      family: pdsFamily,
      education: pdsEducation,
      eligibility: pdsEligibility,
      workExperience: pdsWorkExperience,
      voluntaryWork: pdsVoluntaryWork,
      learningDevelopment: pdsLearningDevelopment,
      otherInfo: pdsOtherInfo,
      references: pdsReferences
    };

    for (const [name, table] of Object.entries(tables)) {
      const rows = await db.select().from(table as any).where(eq((table as any).employeeId, userId));
      console.log(`Table ${name}: ${rows.length} records`);
      if (rows.length > 0) {
        console.log(`First row from ${name}:`, rows[0]);
      }
    }
  } catch (error) {
    console.error('Error checking Sofia related data:', error);
  }
}

checkSofiaRelatedData();
