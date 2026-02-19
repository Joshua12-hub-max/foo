
import { db } from '../db/index.js';
import { recruitmentEmailTemplates } from '../db/schema.js';

async function listTemplates() {
  try {
    const templates = await db.select().from(recruitmentEmailTemplates);
    console.log(`Found ${templates.length} templates.`);
    templates.forEach(t => console.log(`- Stage: ${t.stage_name} | Subject: ${t.subject_template}`));
  } catch (error) {
    console.error('Error listing templates:', error);
  }
}

listTemplates();
