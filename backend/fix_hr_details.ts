import { db } from './db/index.js';
import { pdsHrDetails } from './db/tables/pds.js';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('--- UPDATING HR DETAILS FOR RAMOS AND CAMACHO ---');

  // 1. Update Christian Paul Ramos (Employee ID: 17)
  console.log('Updating Ramos (ID 17)...');
  await db.update(pdsHrDetails)
    .set({
      appointmentType: 'Permanent',
      itemNumber: 'ITEM-RAMOS-001',
      salaryGrade: '15',
      stepIncrement: 1,
      station: 'IT Department',
      officeAddress: 'City Hall, Meycauayan City',
      isOldEmployee: true, // Marked as old employee for testing
      isRegular: true,
      firstDayOfService: '2024-01-15'
    })
    .where(eq(pdsHrDetails.employeeId, 17));

  // 2. Update Allen Camacho (Employee ID: 18)
  console.log('Updating Camacho (ID 18)...');
  await db.update(pdsHrDetails)
    .set({
      appointmentType: 'Permanent',
      itemNumber: 'ITEM-CAMACHO-002',
      salaryGrade: '4',
      stepIncrement: 1,
      station: 'General Services Office',
      officeAddress: 'City Hall, Meycauayan City',
      isOldEmployee: false, // New employee
      isRegular: true,
      firstDayOfService: '2026-04-09'
    })
    .where(eq(pdsHrDetails.employeeId, 18));

  console.log('✅ HR Details synchronized for both employees.');
}

main().catch(console.error);
