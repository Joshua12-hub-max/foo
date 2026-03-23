import { db } from './db/index.js';
import { departments } from './db/schema.js';

async function checkDepts() {
  const depts = await db.select().from(departments);
  console.log(depts);
}

checkDepts().then(() => process.exit(0));
