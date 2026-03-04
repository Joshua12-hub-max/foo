import { db } from './db/index.js';
import { departments } from './db/schema.js';

async function check() {
  const depts = await db.select().from(departments);
  console.log(depts.map(d => ({id: d.id, name: d.name})));
  process.exit(0);
}

check();
