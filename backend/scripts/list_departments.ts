
import { db } from '../db/index.js';
import { departments } from '../db/schema.js';

const listDepartments = async () => {
  console.log('Listing Departments...');
  try {
    const depts = await db.select().from(departments);
    console.table(depts.map(d => ({ id: d.id, name: d.name })));
    process.exit(0);
  } catch (error) {
    console.error('Error listing departments:', error);
    process.exit(1);
  }
};

listDepartments();
