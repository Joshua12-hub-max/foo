import { db } from '../db/index.js';
import { internalPolicies } from '../db/schema.js';

async function seed() {
  console.log('--- SEEDING: Tardiness Policy ---');
  
  await db.insert(internalPolicies).values({
    category: 'tardiness',
    title: 'Standard Tardiness Policy',
    content: JSON.stringify({
      gracePeriod: 15,
      description: 'Standard 15-minute grace period for all employees.'
    })
  }).onDuplicateKeyUpdate({
    set: {
      content: JSON.stringify({
        gracePeriod: 15,
        description: 'Standard 15-minute grace period for all employees.'
      })
    }
  });

  console.log('✅ Tardiness policy seeded with 15-minute grace period.');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
