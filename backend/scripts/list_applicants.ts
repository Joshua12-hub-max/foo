
import { db } from '../db/index.js';
import { recruitmentApplicants } from '../db/schema.js';
import { desc } from 'drizzle-orm';

async function listApplicants() {
  try {
    const applicants = await db.select().from(recruitmentApplicants).orderBy(desc(recruitmentApplicants.created_at));
    
    console.log(`Found ${applicants.length} applicants:`);
    applicants.forEach(app => {
      console.log(`ID: ${app.id} | Name: ${app.first_name} ${app.last_name} | Email: ${app.email} | JobID: ${app.job_id} | Source: ${app.source} | Subject: ${app.email_subject} | Created: ${app.created_at}`);
    });

  } catch (error) {
    console.error('Error listing applicants:', error);
  }
}

listApplicants();
