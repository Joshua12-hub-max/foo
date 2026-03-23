import { db } from '../db/index.js';
import { authentication, plantillaPositions, departments } from '../db/schema.js';
import { eq, inArray } from 'drizzle-orm';

async function resetAdminSetup() {
    console.log('--- Robust Resetting Setup Portal Data ---');
    try {
        // 1. Identify HR Department
        const hrDept = await db.query.departments.findFirst({
            where: eq(departments.name, "Office of the City Human Resource Management Officer")
        });

        if (!hrDept) {
            console.error('HR Department not found by name "Office of the City Human Resource Management Officer". Cannot proceed.');
            return;
        }

        console.log(`Found HR Department (ID: ${hrDept.id})`);

        // 2. Clear all users associated with setup roles
        const setupRoles = ['Administrator', 'Human Resource'];
        const usersToDelete = await db.query.authentication.findMany({
            where: inArray(authentication.role, setupRoles as never)
        });

        if (usersToDelete.length > 0) {
            console.log(`Deleting ${usersToDelete.length} users: ${usersToDelete.map(u => u.email).join(', ')}`);
            await db.delete(authentication).where(inArray(authentication.role, setupRoles as never));
            console.log('Relevant accounts removed.');
        } else {
            console.log('No Administrator or Human Resource users found.');
        }

        // 3. Reset ALL positions in the HR department to vacant
        // This clears both legitimate incumbencies and orphaned ones referencing non-existent users
        const updated = await db.update(plantillaPositions)
            .set({
                isVacant: true,
                incumbentId: null,
                filledDate: null
            })
            .where(eq(plantillaPositions.departmentId, hrDept.id));

        console.log('All positions in HR department have been reset to vacant status.');

        console.log('System initialized for a fresh Admin setup. You can now run the Setup Portal.');
    } catch (error) {
        console.error('Failed to reset setup portal data:', error);
    } finally {
        process.exit(0);
    }
}

resetAdminSetup();
