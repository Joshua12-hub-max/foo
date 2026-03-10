import { db } from '../db/index.js';
import { authentication, departments, plantillaPositions } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';

async function resetSetupPortal() {
    console.log('--- Resetting Setup Portal Data ---');
    try {
        const hrDept = await db.query.departments.findFirst({
            where: or(
                eq(departments.name, "Office of the City Human Resource Management Officer"),
                eq(departments.name, "City Human Resource Management Office"),
                eq(departments.name, "CHRMO"),
                eq(departments.name, "Human Resource Management Office")
            )
        });

        if (!hrDept) {
            console.log("No HR Department found. Ensure the seeding script for departments was run.");
            process.exit(1);
        }

        console.log("Found HR Department:", hrDept.name);

        // 100% Clear ALL Authentication records
        const allUsers = await db.query.authentication.findMany();
        if (allUsers.length > 0) {
            console.log(`Found ${allUsers.length} users to delete. Wiping 100% of authentication records.`);
            await db.delete(authentication);
            console.log('Successfully wiped all authentication records.');
        } else {
            console.log('No users found in authentication table.');
        }

        // 100% Vacant Setup Portal HR positions
        const positions = await db.query.plantillaPositions.findMany({
            where: eq(plantillaPositions.departmentId, hrDept.id)
        });

        if (positions.length > 0) {
            for (const pos of positions) {
                if (!pos.isVacant) {
                    await db.update(plantillaPositions)
                        .set({
                            isVacant: true,
                            incumbentId: null,
                            filledDate: null
                        })
                        .where(eq(plantillaPositions.id, pos.id));
                    console.log(`Reset position to vacant: ${pos.positionTitle}`);
                }
            }
        } else {
            console.log("No HR positions found to vacant.");
        }

        console.log('Setup portal data reset successfully. You can now run the Setup Portal again.');
    } catch (error) {
        console.error('Error resetting setup portal data:', error);
    } finally {
        process.exit(0);
    }
}

resetSetupPortal();