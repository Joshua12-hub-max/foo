import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        await db.execute(sql`ALTER TABLE authentication ADD COLUMN suffix VARCHAR(20)`);
        console.log("Successfully added suffix column to authentication table.");
    } catch (e: unknown) {
        // Might already exist
        console.log("Error or already exists:", e instanceof Error ? e.message : String(e));
    }
    process.exit(0);
}

main();
