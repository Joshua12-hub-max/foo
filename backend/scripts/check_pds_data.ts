import { db } from '../db/index.js';
import { pdsPersonalInformation } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function checkPdsData() {
  try {
    const records = await db.select()
      .from(pdsPersonalInformation)
      .where(eq(pdsPersonalInformation.employeeId, 39));
    
    console.log('Records in pds_personal_information for employeeId 39:', records);
  } catch (error) {
    console.error('Error checking PDS data:', error);
  }
}

checkPdsData();
