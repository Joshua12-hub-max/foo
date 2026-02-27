import { db } from '../db/index.js';
import { tardinessSummary } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
    console.log("Checking Tardiness Summary for CHRMO-004");
    const summary = await db.select().from(tardinessSummary).where(eq(tardinessSummary.employeeId, 'CHRMO-004'));
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
}
run();
