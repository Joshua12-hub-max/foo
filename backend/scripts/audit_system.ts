
import { db } from '../db/index.js';
import { authentication, departments, plantillaPositions } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
    console.log('--- Database Audit ---');
    try {
        const users = await db.query.authentication.findMany();
        console.log('Users found:', users.map(u => ({ id: u.id, email: u.email, role: u.role, positionId: u.positionId })));

        const hrDept = await db.query.departments.findFirst({
            where: eq(departments.name, "Office of the City Human Resource Management Officer")
        });

        if (hrDept) {
            const positions = await db.query.plantillaPositions.findMany({
                where: eq(plantillaPositions.departmentId, hrDept.id)
            });
            console.log('HR Positions:', positions.map(p => ({ 
                id: p.id, 
                title: p.positionTitle, 
                isVacant: p.isVacant, 
                incumbentId: p.incumbentId 
            })));
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

run();
