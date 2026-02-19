
import { db } from '../db/index.js';
import { authentication, plantillaPositions } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function debugDbState() {
    console.log('--- Debugging DB State ---');

    console.log('\n1. Checking Authentication (First 5):');
    const users = await db.query.authentication.findMany({
        limit: 5,
        columns: {
            id: true,
            firstName: true,
            lastName: true,
            employmentStatus: true,
            positionId: true,
            employeeId: true
        }
    });
    console.table(users);

    console.log('\n2. Checking Plantilla Positions (Filled):');
    const filledPositions = await db.query.plantillaPositions.findMany({
        where: (positions, { isNotNull }) => isNotNull(positions.incumbentId),
        limit: 5,
        columns: {
            id: true,
            positionTitle: true,
            incumbentId: true,
            itemNumber: true
        }
    });
    console.table(filledPositions);

    if (users.length > 0 && filledPositions.length > 0) {
        console.log('\n3. Checking specific join:');
        const user = users[0];
        console.log(`Checking join for user ID ${user.id} (${user.firstName})...`);
        const pos = await db.query.plantillaPositions.findFirst({
            where: eq(plantillaPositions.incumbentId, user.id)
        });
        console.log('Found Position?', pos ? `Yes: ${pos.positionTitle}` : 'No');
        
        console.log('User Employment Status:', user.employmentStatus);
        console.log(`Is '${user.employmentStatus}' == 'Active'?`, user.employmentStatus === 'Active');
    }
}

debugDbState().catch(console.error).finally(() => process.exit());
