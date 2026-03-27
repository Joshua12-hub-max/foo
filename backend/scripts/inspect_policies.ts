import { db } from '../db/index.js';
import { internalPolicies } from '../db/schema.js';

async function inspect() {
  console.log('--- Internal Policies Inspection ---');
  const policies = await db.select().from(internalPolicies);
  console.log(JSON.stringify(policies, null, 2));
  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
