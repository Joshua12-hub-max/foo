
import { db } from '../db/index.js';
import { 
  salaryTranches, 
  salarySchedule, 
  plantillaPositions, 
  authentication,
  departments,
  plantillaPositionHistory
} from '../db/schema.js';
import { eq } from 'drizzle-orm';

// --- DATA: Salary Schedule (Tranche 2 - 2024/2025 Mock Adjusted) ---
// Based on typical SSL V / VI Tranches (simplified for example but rigorous in structure)
// We will generate Grades 1-33 with 8 steps each.
// Logic: Base salary + (Grade * Increment) + (Step * Increment)
function generateSalarySchedule(tranche: number) {
    const schedule = [];
    let base = 13000; // SG 1 Step 1
    
    for (let grade = 1; grade <= 33; grade++) {
        const gradeBase = base * Math.pow(1.10, grade - 1); // 10% increase per grade
        for (let step = 1; step <= 8; step++) {
            const stepIncrement = gradeBase * 0.015; // 1.5% increase per step
            const salary = Math.round(gradeBase + ((step - 1) * stepIncrement));
            schedule.push({
                salaryGrade: grade,
                step: step,
                monthlySalary: String(salary),
                tranche: tranche,
                effectivityDate: '2024-01-01'
            });
        }
    }
    return schedule;
}

const TRANCHE_2_SCHEDULE = generateSalarySchedule(2);

// --- DATA: Sample Plantilla Positions ---
const POSITIONS = [
    { title: 'Administrative Aide I', grade: 1, department: 'City Mayor\'s Office' },
    { title: 'Administrative Aide III', grade: 3, department: 'City Mayor\'s Office' },
    { title: 'Administrative Aide VI', grade: 6, department: 'City Human Resource Management Office' },
    { title: 'Human Resource Management Officer I', grade: 11, department: 'City Human Resource Management Office' },
    { title: 'Human Resource Management Officer III', grade: 18, department: 'City Human Resource Management Office' },
    { title: 'Department Head', grade: 26, department: 'City Human Resource Management Office' },
    { title: 'City Accountant', grade: 26, department: 'City Accountant\'s Office' },
    { title: 'Nurse I', grade: 15, department: 'City Health Office' },
];

async function seedPlantillaTranche2() {
    console.log('--- Seeding Plantilla and Tranche 2 ---');

    await db.transaction(async (tx) => {
        // 1. Seed Tranche 2
        console.log('Seeding Salary Tranches...');
        const existingTranche = await tx.query.salaryTranches.findFirst({
            where: eq(salaryTranches.trancheNumber, 2)
        });

        if (!existingTranche) {
            await tx.insert(salaryTranches).values({
                trancheNumber: 2,
                name: 'Salary Standardization Law V - Tranche 2',
                circularNumber: 'NBC 579',
                effectiveDate: '2024-01-01',
                dateIssued: '2024-01-01',
                isActive: true, // Set as Active
                applicableTo: 'Civilian Government Personnel'
            });
        } else {
             // Ensure it is active
             await tx.update(salaryTranches).set({ isActive: true }).where(eq(salaryTranches.trancheNumber, 2));
        }

        // Deactivate others
        // (Skipping for now to keep simple, assuming 2 is main)
        
        // 2. Seed Salary Schedule
        console.log('Seeding Salary Schedule (Grades 1-33, Steps 1-8)...');
        // Check if seeded
        const scheduleCount = await tx.query.salarySchedule.findFirst({
            where: eq(salarySchedule.tranche, 2)
        });

        if (!scheduleCount) {
             // Batch insert might be too large, so chunk it
             const chunkSize = 50;
             for (let i = 0; i < TRANCHE_2_SCHEDULE.length; i += chunkSize) {
                 const chunk = TRANCHE_2_SCHEDULE.slice(i, i + chunkSize);
                 await tx.insert(salarySchedule).values(chunk);
             }
             console.log(`Inserted ${TRANCHE_2_SCHEDULE.length} salary schedule items.`);
        }

        // 3. Seed Departments (Ensure CHRMO exists)
        console.log('Checking Departments...');
        const depts = [...new Set(POSITIONS.map(p => p.department))];
        for (const deptName of depts) {
            const exists = await tx.query.departments.findFirst({
                where: eq(departments.name, deptName)
            });
            if (!exists) {
                await tx.insert(departments).values({
                    name: deptName,
                    description: deptName
                });
            }
        }

        // 4. Seed Plantilla Positions
        console.log('Seeding Plantilla Positions...');
        const deptMap = new Map();
        const allDepts = await tx.query.departments.findMany();
        allDepts.forEach(d => deptMap.set(d.name, d.id));

        for (const [index, pos] of POSITIONS.entries()) {
             const itemNumber = `ITEM-${2025}-${(index + 1).toString().padStart(3, '0')}`;
             
             // Get Correct Salary from Schedule (Step 1 Base)
             const salary = TRANCHE_2_SCHEDULE.find(s => s.salaryGrade === pos.grade && s.step === 1);
             
             // Check if exists
             const exists = await tx.query.plantillaPositions.findFirst({
                 where: eq(plantillaPositions.itemNumber, itemNumber)
             });

             if (!exists) {
                 await tx.insert(plantillaPositions).values({
                     itemNumber: itemNumber,
                     positionTitle: pos.title,
                     salaryGrade: pos.grade,
                     stepIncrement: 1,
                     department: pos.department,
                     departmentId: deptMap.get(pos.department),
                     monthlySalary: salary?.monthlySalary || '0',
                     isVacant: true,
                     status: 'Active'
                 });
             }
        }

        // 5. Seed/Update Employees to Match Positions
        // specifically CHRMO employees to be eligible
        console.log('Updating Employees to match Plantilla...');
        
        // Find 'Human Resource Management Officer I' position
        const hrmoPos = await tx.query.plantillaPositions.findFirst({
            where: eq(plantillaPositions.itemNumber, `ITEM-2025-004`) // Index 3 + 1
        });

        if (hrmoPos) {
            // Find an employee to assign - TRY ANY USER if specific one fails
            let employee = await tx.query.authentication.findFirst({
                where: eq(authentication.employeeId, 'CHRMO-2026-0002')
            });
            
            if (!employee) {
                // Fallback to first user
                employee = await tx.query.authentication.findFirst();
            }

            if (employee) {
                // Assign to position
                // Logic: 3 Years service, Step 2
                // We want them to be eligible for Step 3 in Tranche 2
                
                // Get Salary for SG 11 Step 2
                const step2Salary = TRANCHE_2_SCHEDULE.find(s => s.salaryGrade === 11 && s.step === 2);
                
                await tx.update(authentication).set({
                    positionTitle: hrmoPos.positionTitle,
                    positionId: hrmoPos.id,
                    jobTitle: hrmoPos.positionTitle,
                    department: hrmoPos.department,
                    itemNumber: hrmoPos.itemNumber,
                    salaryGrade: String(hrmoPos.salaryGrade),
                    stepIncrement: 2, // Current Step 2
                    dateHired: '2020-01-01', // > 3 years ago
                    lastPromotionDate: '2020-01-01', // > 3 years ago
                    employmentStatus: 'Active' // FORCE ACTIVE
                }).where(eq(authentication.id, employee.id));

                await tx.update(plantillaPositions).set({
                    isVacant: false,
                    incumbentId: employee.id,
                    stepIncrement: 2,
                    monthlySalary: step2Salary?.monthlySalary,
                    filledDate: '2020-01-01'
                }).where(eq(plantillaPositions.id, hrmoPos.id));
                
                // Add History if not exists
                // (Simplified: just insert, assumed cleanup or fresh enough)
                 await tx.insert(plantillaPositionHistory).values({
                     positionId: hrmoPos.id,
                     employeeId: employee.id,
                     employeeName: `${employee.firstName} ${employee.lastName}`,
                     positionTitle: hrmoPos.positionTitle,
                     startDate: '2020-01-01'
                });

                console.log(`Assigned ${employee.firstName} to ${hrmoPos.positionTitle} (Eligible for Increment)`);
            } else {
                console.error('FAIL: No employees found to seed assignment.');
            }
        }
    });
    
    console.log('Seeding Complete.');
}

seedPlantillaTranche2().catch(console.error).finally(() => process.exit());
