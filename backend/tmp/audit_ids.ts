import { db } from '../db/index.js';
import { dailyTimeRecords, authentication } from '../db/schema.js';
import { sql } from 'drizzle-orm';

async function auditIntegrity() {
  console.log("=== STARTING ID INTEGRITY AUDIT ===");
  
  try {
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

    // 3. Literal Check for Joshua and Ramos
    console.log("\n[FORENSIC] Checking specifically for 'Joshua' and 'Ramos' overlap:");
    const results = await db.execute(sql`
      SELECT 
        d.employee_id as dtr_employee_id,
        a.employee_id as auth_employee_id,
        a.first_name,
        a.last_name
      FROM daily_time_records d
      JOIN authentication a ON (d.employee_id = a.employee_id OR CAST(d.employee_id AS UNSIGNED) = CAST(a.employee_id AS UNSIGNED))
      WHERE a.last_name LIKE '%Palero%' OR a.last_name LIKE '%Ramos%'
    `);

    // @ts-ignore
    console.log(JSON.stringify(results[0], null, 2));

  } catch (err) {
    console.error("Audit failed:", err);
  } finally {
    process.exit(0);
  }
}

auditIntegrity();
