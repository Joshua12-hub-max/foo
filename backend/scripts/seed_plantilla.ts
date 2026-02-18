
import { db } from '../db/index.js';
import { 
    plantillaPositions, 
    qualificationStandards, 
    authentication,
    departments
} from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

async function seedPlantilla() {
    console.log('🌱 Starting Plantilla Seeding...');

    // 1. Get CHRMO Department
    const chrmo = await db.query.departments.findFirst({
        where: eq(departments.name, 'CHRMO'),
    });

    if (!chrmo) {
        console.error('❌ CHRMO Department not found. Please run seed_chrmo.ts first.');
        process.exit(1);
    }
    console.log(`✅ Found CHRMO Department (ID: ${chrmo.id})`);

    // 2. Define Positions
    interface PositionTemplate {
        title: string;
        sg: number;
        itemNumberBase: string;
        count: number;
        assignmentStrategy: 'Head' | 'Staff'; 
    }

    const positions: PositionTemplate[] = [
        { title: "Department Head", sg: 24, itemNumberBase: "CHRMO-HEAD", count: 1, assignmentStrategy: 'Head' },
        { title: "Administrative Officer V", sg: 18, itemNumberBase: "CHRMO-AO5", count: 2, assignmentStrategy: 'Staff' },
        { title: "Administrative Assistant III", sg: 9, itemNumberBase: "CHRMO-AA3", count: 12, assignmentStrategy: 'Staff' },
    ];

    // 3. Get Employees
    const allEmployees = await db.query.authentication.findMany({
        where: eq(authentication.departmentId, chrmo.id),
        orderBy: (users, { asc }) => [asc(users.id)], // Standardize order 1-15
    });
    
    // Separate Head and Staff
    const headEmployee = allEmployees.find(e => e.jobTitle === "Department Head");
    const staffEmployees = allEmployees.filter(e => e.jobTitle !== "Department Head");

    console.log(`Found ${allEmployees.length} employees (` + 
        `${headEmployee ? '1 Head' : '0 Head'}, ${staffEmployees.length} Staff)`);

    let staffIndex = 0;

    for (const pos of positions) {
        // Ensure Qualification Standard exists (Simplified)
        let qs = await db.query.qualificationStandards.findFirst({
            where: and(
                eq(qualificationStandards.positionTitle, pos.title),
                eq(qualificationStandards.salaryGrade, pos.sg)
            )
        });

        if (!qs) {
            console.log(`Creating QS for ${pos.title}...`);
            const [res] = await db.insert(qualificationStandards).values({
                positionTitle: pos.title,
                salaryGrade: pos.sg,
                educationRequirement: "Bachelor's Degree",
                eligibilityRequired: "Career Service Professional",
                experienceYears: 1,
                trainingHours: 4,
            });
            qs = { id: res.insertId } as any;
        }

        // Create Items
        for (let i = 1; i <= pos.count; i++) {
            const itemNumber = `${pos.itemNumberBase}-${i}`;
            
            // Determine incumbent
            let incumbentId: number | null = null;
            let incumbentName: string | null = null;

            if (pos.assignmentStrategy === 'Head' && headEmployee && i === 1) {
                incumbentId = headEmployee.id;
                incumbentName = `${headEmployee.firstName} ${headEmployee.lastName}`;
            } else if (pos.assignmentStrategy === 'Staff' && staffIndex < staffEmployees.length) {
                incumbentId = staffEmployees[staffIndex].id;
                incumbentName = `${staffEmployees[staffIndex].firstName} ${staffEmployees[staffIndex].lastName}`;
                staffIndex++;
            }

            // Check if item exists
            const existingItem = await db.query.plantillaPositions.findFirst({
                where: eq(plantillaPositions.itemNumber, itemNumber)
            });

            if (existingItem) {
                console.log(`Updating Item ${itemNumber}...`);
                await db.update(plantillaPositions).set({
                    incumbentId: incumbentId,
                    isVacant: incumbentId ? 0 : 1,
                    filledDate: incumbentId ? "2025-01-01" : null,
                }).where(eq(plantillaPositions.id, existingItem.id));
            } else {
                console.log(`Creating Item ${itemNumber}...`);
                await db.insert(plantillaPositions).values({
                    itemNumber: itemNumber,
                    positionTitle: pos.title,
                    salaryGrade: pos.sg,
                    departmentId: chrmo.id,
                    department: chrmo.name,
                    qualificationStandardsId: qs!.id,
                    incumbentId: incumbentId,
                    isVacant: incumbentId ? 0 : 1, // 0 = false (filled), 1 = true (vacant)
                    filledDate: incumbentId ? "2025-01-01" : null,
                    status: 'Active',
                    monthlySalary: (pos.sg * 15000).toString(), // Dummy calculation
                });
            }

            if (incumbentId && incumbentName) {
                // Determine if history log is needed (skipped for simplicity in seeding, but optional here)
                console.log(`  > Assigned to: ${incumbentName}`);
            }
        }
    }

    console.log('✅ Plantilla Seeding Complete.');
    process.exit(0);
}

seedPlantilla().catch(err => {
    console.error('Failed:', err);
    process.exit(1);
});
