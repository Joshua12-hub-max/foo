import { db } from './db/index.js';
import { departments } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function fixDeptName() {
  await db.update(departments)
    .set({ name: 'Office of the City Human Resource Management Officer' })
    .where(eq(departments.id, 1));
  console.log('Department name fixed.');
}

fixDeptName().then(() => process.exit(0));
