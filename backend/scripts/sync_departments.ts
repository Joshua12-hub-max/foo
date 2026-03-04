import { db } from '../db/index.js';
import { authentication, departments } from '../db/schema.js';
import { isNull, eq } from 'drizzle-orm';

async function syncDepartments() {
  try {
    console.log('Fetching departments from DB...');
    const allDepts = await db.select().from(departments);
    const deptMap = new Map<string, number>();
    allDepts.forEach(d => deptMap.set(d.name, d.id));

    console.log(`Found ${allDepts.length} departments.`);

    console.log('Fetching employees with null departmentId...');
    const employees = await db.select({
      id: authentication.id,
      department: authentication.department
    })
    .from(authentication)
    .where(isNull(authentication.departmentId));

    console.log(`Found ${employees.length} employees to update.`);

    let updatedCount = 0;
    for (const emp of employees) {
      if (emp.department && deptMap.has(emp.department)) {
        const deptId = deptMap.get(emp.department)!;
        await db.update(authentication)
          .set({ departmentId: deptId })
          .where(eq(authentication.id, emp.id));
        updatedCount++;
      }
    }

    console.log(`Successfully updated ${updatedCount} employees.`);
    process.exit(0);
  } catch (err) {
    console.error('Error syncing departments:', err);
    process.exit(1);
  }
}

syncDepartments();
