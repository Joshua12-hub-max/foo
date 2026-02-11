
import { db } from './db/index.js';
import { leaveBalances, authentication } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
    console.log('Checking Join Integrity...');
    
    const balances = await db.select().from(leaveBalances).limit(5);
    console.log('Sample Balances:', balances);

    if (balances.length > 0) {
        const empId = balances[0].employeeId;
        console.log(`Checking Auth for EmployeeID: '${empId}' (Length: ${empId.length})`);
        
        const auth = await db.query.authentication.findFirst({
            where: eq(authentication.employeeId, empId)
        });
        console.log('Auth Match:', auth);
        
        if (!auth) {
            console.log('⚠️ No match found! Listing all auth employeeIds:');
            const allAuth = await db.select({ id: authentication.employeeId }).from(authentication);
            console.log(allAuth.map(a => `'${a.id}'`));
        }
    }
    process.exit(0);
}

run();
