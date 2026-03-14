
import { db } from '../db/index.js';
import { authentication, plantillaPositions, departments } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
    console.log('--- Detailed User & Position Audit ---');
    try {
        const users = await db.query.authentication.findMany();
        console.log('Total Users:', users.length);
        users.forEach(u => {
            console.log(`User ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, PositionID: ${u.positionId}`);
        });

        const allPositions = await db.query.plantillaPositions.findMany();
        console.log('Total Positions:', allPositions.length);

        const hrDept = await db.query.departments.findFirst({
            where: eq(departments.name, "Office of the City Human Resource Management Officer")
        });

        if (hrDept) {
            console.log('HR Dept ID:', hrDept.id);
            const hrPositions = await db.query.plantillaPositions.findMany({
                where: eq(plantillaPositions.departmentId, hrDept.id)
            });
            console.log('HR Positions:');
            hrPositions.forEach(p => {
                console.log(`- ID: ${p.id}, Title: ${p.positionTitle}, Vacant: ${p.isVacant}, Incumbent: ${p.incumbentId}`);
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
