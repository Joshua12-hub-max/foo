
import { db } from './db/index.js';
import { leaveBalances, authentication } from './db/schema.js';
import { eq, sql } from 'drizzle-orm';

async function run() {
    console.log('Checking Leave Balances...');
    
    const year = 2026;
    const credits = await db.select({
      id: leaveBalances.id,
      employee_id: leaveBalances.employeeId,
      credit_type: leaveBalances.creditType,
      balance: leaveBalances.balance,
      year: leaveBalances.year,
      updated_at: leaveBalances.updatedAt,
      first_name: sql<string>`COALESCE(${authentication.firstName}, '')`,
      last_name: sql<string>`COALESCE(${authentication.lastName}, '')`,
      department: sql<string>`COALESCE(${authentication.department}, 'N/A')`
    })
    .from(leaveBalances)
    .leftJoin(authentication, eq(leaveBalances.employeeId, authentication.employeeId))
    .where(eq(leaveBalances.year, year))
    .limit(5);
    
    if (credits.length === 0) {
        console.log('❌ No credits found for 2026!');
    } else {
        console.log(`✅ Found ${credits.length} credits:`);
        credits.forEach(c => {
            console.log(JSON.stringify(c, null, 2));
        });
    }
    process.exit(0);
}

run();
