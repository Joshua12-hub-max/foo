import { db } from '../db/index';
import { departments, plantillaPositions } from '../db/schema';
import { eq, _inArray } from 'drizzle-orm';

const departmentsData = [
    { name: "Office of the City Mayor", description: "CMO" },
    { name: "Office of the City Vice Mayor", description: "CVMO" },
    { name: "Office of the Sangguniang Panlungsod", description: "SPO" },
    { name: "Office of the City Accountant", description: "CAcO" },
    { name: "Office of the City Administrator", description: "CAdO" },
    { name: "Office of the City Agriculturist", description: "CAgO" },
    { name: "Office of the City Assessor", description: "CAsO" },
    { name: "Office of the City Budget Officer", description: "CBO" },
    { name: "Office of the City Civil Registrar", description: "CCRO" },
    { name: "Office of the City Cooperatives Development Officer", description: "CCDO" },
    { name: "Office of the Local Disaster Risk Reduction and Management Officer", description: "LDRRMO" },
    { name: "Office of the City Engineer", description: "CEO" },
    { name: "Office of the City Environment and Natural Resources Officer", description: "CENRO" },
    { name: "Office of the City General Services Officer", description: "CGSO" },
    { name: "Office of the City Health Officer", description: "CHO" },
    { name: "Office of the City Human Resource Management Officer", description: "CHRMO" },
    { name: "Office of the City Information Officer", description: "CIO" },
    { name: "Office of the City Legal Officer", description: "CLO" },
    { name: "Office of the City Planning and Development Coordinator", description: "CPDO" },
    { name: "Office of the City Population Officer", description: "CPO" },
    { name: "Office of the City Public Employment Service Manager", description: "CPESO" },
    { name: "Office of the City Social Welfare and Development Officer", description: "CSWDO" },
    { name: "Office of the City Treasurer", description: "CTO" },
    { name: "Office of the City Veterinarian", description: "CVO" },
    { name: "Office of the City Business Permit and Licensing Officer", description: "CBPLO" },
    { name: "Polytechnic College of the City of Meycauayan", description: "PCCM" },
    { name: "Ospital ng Meycauayan", description: "OsMeyc" },
    { name: "Office of the Secretary to the Sangguniang Panlungsod", description: "SSPO" }
];

async function seedDepartmentsAndHRPositions() {
    console.log('--- Seeding Departments and HR Positions ---');
    try {
        // 1. Seed Departments
        for (const dept of departmentsData) {
            const existing = await db.query.departments.findFirst({
                where: eq(departments.name, dept.name)
            });

            if (!existing) {
                await db.insert(departments).values(dept);
                console.log(`Inserted department: ${dept.name}`);
            } else {
                // Update description (acronym) if it exists but differs
                if (existing.description !== dept.description) {
                    await db.update(departments)
                        .set({ description: dept.description })
                        .where(eq(departments.id, existing.id));
                    console.log(`Updated acronym for: ${dept.name}`);
                }
            }
        }

        // 2. Seed HR Positions
        const hrDept = await db.query.departments.findFirst({
            where: eq(departments.name, "Office of the City Human Resource Management Officer")
        });

        if (!hrDept) {
            throw new Error("CHRMO department not found after seeding.");
        }

        const hrPositions = [
            {
                itemNumber: "CHRMO-HEAD-001",
                positionTitle: "City Government Department Head I",
                salaryGrade: 26,
                departmentId: hrDept.id,
                department: hrDept.name,
                isVacant: true
            },
            {
                itemNumber: "CHRMO-AV-001",
                positionTitle: "Administrative Officer V",
                salaryGrade: 18,
                departmentId: hrDept.id,
                department: hrDept.name,
                isVacant: true
            }
        ];

        for (const pos of hrPositions) {
            const existingPos = await db.query.plantillaPositions.findFirst({
                where: eq(plantillaPositions.itemNumber, pos.itemNumber)
            });

            if (!existingPos) {
                await db.insert(plantillaPositions).values(pos);
                console.log(`Inserted position: ${pos.positionTitle}`);
            } else {
                await db.update(plantillaPositions)
                    .set({
                        positionTitle: pos.positionTitle,
                        salaryGrade: pos.salaryGrade,
                        departmentId: pos.departmentId,
                        department: pos.department,
                        isVacant: true // Force vacant for setup
                    })
                    .where(eq(plantillaPositions.id, existingPos.id));
                console.log(`Updated and reset position: ${pos.positionTitle}`);
            }
        }

        console.log('Seeding completed successfully.');
    } catch (error) {
        console.error('Error during seeding:', error);
    } finally {
        process.exit(0);
    }
}

seedDepartmentsAndHRPositions();