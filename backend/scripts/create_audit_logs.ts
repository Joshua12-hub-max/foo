import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';

async function main() {
  try {
    console.log('Creating audit_logs table...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS \`audit_logs\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`user_id\` int,
        \`module\` varchar(50) NOT NULL,
        \`action\` varchar(50) NOT NULL,
        \`details\` text,
        \`ip_address\` varchar(45),
        \`user_agent\` text,
        \`created_at\` timestamp DEFAULT (now()),
        CONSTRAINT \`audit_logs_id\` PRIMARY KEY(\`id\`)
      );
    `);
    console.log('Table created or already exists.');
    
    // Add foreign key constraint if it doesn't exist
    try {
        console.log('Adding foreign key...');
        await db.execute(sql`
            ALTER TABLE \`audit_logs\` 
            ADD CONSTRAINT \`audit_logs_user_id_authentication_id_fk\` 
            FOREIGN KEY (\`user_id\`) REFERENCES \`authentication\`(\`id\`) ON DELETE set null;
        `);
    } catch (e: unknown) {
        const err = e as Error;
        if (err.message && err.message.includes('Duplicate check constraint')) {
            console.log('FK already exists.');
        } else {
            console.log('FK error (might already exist):', err.message);
        }
    }
    
    // Add indexes
    try {
        console.log('Adding indexes...');
        await db.execute(sql`CREATE INDEX \`idx_user_id\` ON \`audit_logs\` (\`user_id\`);`);
    } catch (e) { console.log('Index idx_user_id might exist:', (e as Error).message); }
    try {
        await db.execute(sql`CREATE INDEX \`idx_module\` ON \`audit_logs\` (\`module\`);`);
    } catch (e: unknown) { console.log('Index idx_module might exist:', (e as Error).message); }
    try {
        await db.execute(sql`CREATE INDEX \`idx_created_at\` ON \`audit_logs\` (\`created_at\`);`);
    } catch (e: unknown) { console.log('Index idx_created_at might exist:', (e as Error).message); }

    console.log('Successfully configured audit_logs table.');
    process.exit(0);
  } catch (err: unknown) {
    console.error('Core Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
