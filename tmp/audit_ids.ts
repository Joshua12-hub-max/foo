import { db } from './backend/db/index.js';
import { dailyTimeRecords, authentication } from './backend/db/schema.js';
import { sql } from 'drizzle-orm';

async function auditIntegrity() {
  console.log("=== STARTING ID INTEGRITY AUDIT ===");
  
  // 1. Check for raw ID values in DTR
  const dtrIds = await db.select({
    employeeId: dailyTimeRecords.employeeId,
    rawCount: sql<number>`COUNT(*)`
  })
  .from(dailyTimeRecords)
  .groupBy(dailyTimeRecords.employeeId);

  console.log("\n[DTR] Unique IDs in daily_time_records:");
  dtrIds.forEach(id => {
    console.log(`- ID: "${id.employeeId}" (String length: ${id.employeeId?.length || 0}) | Count: ${id.rawCount}`);
  });

  // 2. Check for raw ID values in Authentication
  const authIds = await db.select({
    employeeId: authentication.employeeId,
    firstName: authentication.firstName,
    lastName: authentication.lastName
  })
  .from(authentication);

  console.log("\n[AUTH] IDs in authentication:");
  authIds.forEach(id => {
    console.log(`- ID: "${id.employeeId}" | Name: ${id.firstName} ${id.lastName}`);
  });

  // 3. Check for "Invisible" Numeric Matches
  console.log("\n[FORENSIC] Checking for Numeric Cross-Matching (where '1' = '01'):");
  const conflicts = await db.execute(sql`
    SELECT 
      d.employee_id as dtr_id, 
      a.employee_id as auth_id, 
      a.first_name, a.last_name
    FROM daily_time_records d
    JOIN authentication a ON d.employee_id = a.employee_id
    WHERE d.employee_id != a.employee_id
  `);

  // @ts-ignore
  if (conflicts[0] && conflicts[0].length > 0) {
    console.warn("!!! FOUND HIDDEN CROSS-MATCHES !!!");
    // @ts-ignore
    conflicts[0].forEach(c => {
      console.warn(`- DTR ID "${c.dtr_id}" matches AUTH ID "${c.auth_id}" for ${c.first_name} ${c.last_name}`);
    });
  } else {
    console.log("No cross-matching found via standard JOIN.");
  }

  process.exit(0);
}

auditIntegrity().catch(err => {
  console.error(err);
  process.exit(1);
});
