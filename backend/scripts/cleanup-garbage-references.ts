import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';

async function cleanupGarbageReferences() {
  try {
    console.log('🧹 Checking for garbage references...\n');

    // Find garbage references
    const garbageRefs = await db.execute(sql`
      SELECT id, employee_id, name, address, tel_no
      FROM pds_references
      WHERE
        LENGTH(name) < 3
        OR LENGTH(address) > 200
        OR name REGEXP '^[0-9]+\\.?[a-z]?\\.?$'
        OR address LIKE '%I declare under oath%'
        OR address LIKE '%personally accomplished%'
    `);

    const refs = garbageRefs[0] as any[];

    if (refs.length === 0) {
      console.log('✅ No garbage references found!');
      process.exit(0);
    }

    console.log(`Found ${refs.length} garbage reference(s):\n`);
    refs.forEach((ref) => {
      console.log(`ID: ${ref.id}, Employee: ${ref.employee_id}`);
      console.log(`  Name: "${ref.name}"`);
      console.log(`  Address: "${ref.address?.substring(0, 50)}${ref.address?.length > 50 ? '...' : ''}"`);
      console.log('');
    });

    console.log('⚠️  Would you like to delete these? (Run with --delete flag)');
    console.log('   npx tsx scripts/cleanup-garbage-references.ts --delete\n');

    // Check for --delete flag
    if (process.argv.includes('--delete')) {
      const result = await db.execute(sql`
        DELETE FROM pds_references
        WHERE
          LENGTH(name) < 3
          OR LENGTH(address) > 200
          OR name REGEXP '^[0-9]+\\.?[a-z]?\\.?$'
          OR address LIKE '%I declare under oath%'
          OR address LIKE '%personally accomplished%'
      `);

      console.log(`✅ Deleted ${refs.length} garbage reference(s)`);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupGarbageReferences();
