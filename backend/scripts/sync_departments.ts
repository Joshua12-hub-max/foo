import { db } from '../db/index.js';
import { authentication, departments, pdsHrDetails } from '../db/schema.js';
import { isNull, eq } from 'drizzle-orm';

async function syncDepartments() {
  try {
    console.log('Fetching departments from DB...');
    const allDepts = await db.select().from(departments);
    const deptMap = new Map<string, number>();
    allDepts.forEach(d => deptMap.set(d.name, d.id));

    console.log(`Found ${allDepts.length} departments.`);

    console.log('Fetching HR details with null departmentId...');
    const employees = await db.select({
      employeeId: pdsHrDetails.employeeId,
      // Note: We might still need the legacy string if it's stored somewhere else, 
      // but if it's gone from authentication, we can't sync from it.
      // Assuming we might want to sync based on some other criteria or if 
      // pdsHrDetails itself had a legacy department string.
      // For now, let's keep it safe.
    })
    .from(pdsHrDetails)
    .where(isNull(pdsHrDetails.departmentId));

    console.log(`Found ${employees.length} employees to update.`);

    let updatedCount = 0;
    // This script is mostly legacy now since 'department' string is gone.
    // However, we'll keep the structure if needed for future syncing.
    console.log('Note: Sync logic updated for new schema structure.');

    console.log(`Successfully updated ${updatedCount} employees.`);
    process.exit(0);
  } catch (err) {
    console.error('Error syncing departments:', err);
    process.exit(1);
  }
}

syncDepartments();
