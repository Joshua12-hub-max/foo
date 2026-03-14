
import { db } from './db/index.js';
import { leaveApplications, authentication } from './db/schema.js';
import { eq, and, desc } from 'drizzle-orm';

async function main() {
  const employeeId = 'Emp-001';
  console.log('Searching for employeeId:', employeeId);

  try {
    const conditions = [eq(leaveApplications.employeeId, employeeId)];
    const where = and(...conditions);

    // Count total
    const [countResult] = await db.select({ total: sql`count(*)` })
      .from(leaveApplications)
      .where(where);
    console.log('Count Result:', countResult);

    // Fetch applications
    const leaves = await db.select({
      id: leaveApplications.id,
      employeeId: leaveApplications.employeeId,
      status: leaveApplications.status,
    })
    .from(leaveApplications)
    .leftJoin(authentication, eq(leaveApplications.employeeId, authentication.employeeId))
    .where(where)
    .orderBy(desc(leaveApplications.createdAt));

    console.log('Leaves Found:', leaves);

  } catch (error) {
    console.error('Query Error:', error);
  } finally {
    process.exit(0);
  }
}

// Mock sql tagged template if needed, or import it
import { sql } from 'drizzle-orm';

main();
