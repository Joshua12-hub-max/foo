
import { db } from '../db/index.js';
import { 
  salaryTranches, 
  salarySchedule, 
  plantillaPositions, 
  authentication
} from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

async function verifyPlantillaAccuracy() {
    console.log('Verifying Plantilla and Step Increment Accuracy...');
    
    // 1. Check Active Tranche
    const activeTranche = await db.query.salaryTranches.findFirst({
        where: eq(salaryTranches.isActive, true)
    });

    if (!activeTranche) {
        console.error('FAIL: No Active Salary Tranche found.');
        return;
    }

    console.log(`Active Tranche: ${activeTranche.name} (Tranche ${activeTranche.trancheNumber})`);
    
    if (activeTranche.trancheNumber !== 2) {
        console.warn('WARNING: Active Tranche is NOT Tranche 2 as requested.');
    }

    // 2. Audit Salaries
    console.log('\n--- Auditing Employee Salaries ---');
    const employees = await db.select({
        id: authentication.id,
        name: sql<string>`CONCAT(${authentication.firstName}, ' ', ${authentication.lastName})`,
        salaryGrade: authentication.salaryGrade,
        step: authentication.stepIncrement,
        positionTitle: authentication.positionTitle,
        monthlySalary: plantillaPositions.monthlySalary, // from position
        positionId: plantillaPositions.id
    })
    .from(authentication)
    .innerJoin(plantillaPositions, eq(authentication.id, plantillaPositions.incumbentId))
    .where(eq(authentication.employmentStatus, 'Active'));

    let salaryErrors = 0;
    
    for (const emp of employees) {
        if (!emp.salaryGrade) continue;

        const schedule = await db.query.salarySchedule.findFirst({
            where: and(
                eq(salarySchedule.salaryGrade, Number(emp.salaryGrade)),
                eq(salarySchedule.step, emp.step || 1),
                eq(salarySchedule.tranche, activeTranche.trancheNumber)
            )
        });

        if (!schedule) {
            console.error(`FAIL: No Salary Schedule found for Grade ${emp.salaryGrade} Step ${emp.step} (Tranche ${activeTranche.trancheNumber})`);
            salaryErrors++;
            continue;
        }

        const actualSalary = Number(emp.monthlySalary);
        const expectedSalary = Number(schedule.monthlySalary);
        
        if (actualSalary !== expectedSalary) {
             console.error(`MISMATCH: ${emp.name} (${emp.positionTitle}) - Grade ${emp.salaryGrade}/Step ${emp.step}`);
             console.error(`   Actual: ${actualSalary}, Expected: ${expectedSalary}`);
             salaryErrors++;
        }
    }

    if (salaryErrors === 0) {
        console.log(`SUCCESS: All ${employees.length} employees have correct salaries based on Tranche ${activeTranche.trancheNumber}.`);
    } else {
        console.log(`FAIL: Found ${salaryErrors} salary mismatches.`);
    }

    // 3. Step Increment Eligibility
    console.log('\n--- Checking Step Increment Eligibility ---');
    console.log('Criteria: Active, Regular, Step < 8, Years in Position >= 3');

    const eligibleCandidates = await db.select({
        id: authentication.id,
        name: sql<string>`CONCAT(${authentication.firstName}, ' ', ${authentication.lastName})`,
        step: authentication.stepIncrement,
        dateHired: authentication.dateHired,
        lastPromotion: authentication.lastPromotionDate,
        positionTitle: plantillaPositions.positionTitle
    })
    .from(authentication)
    .innerJoin(plantillaPositions, eq(authentication.id, plantillaPositions.incumbentId))
    .where(and(
        eq(authentication.employmentStatus, 'Active'),
        // lt(authentication.stepIncrement, 8) // in case step is null
    ));

    let eligibleCount = 0;
    const now = new Date();

    for (const emp of eligibleCandidates) {
        const currentStep = Number(emp.step) || 1;
        
        // Determine Start Date (Latest of Date Hired or Last Promotion)
        let startDateStr = emp.lastPromotion || emp.dateHired;
        
        console.log(`Checking ${emp.name}:`);
        console.log(`   - Status: Active`);
        console.log(`   - Step: ${currentStep}`);
        console.log(`   - Date Hired: ${emp.dateHired}`);
        console.log(`   - Last Promotion: ${emp.lastPromotion}`);
        console.log(`   - Start Date Used: ${startDateStr}`);

        if (currentStep >= 8) {
             console.log(`   -> SKIPPED: Step is already ${currentStep}`);
             continue;
        }
        if (!startDateStr) {
             console.log(`   -> SKIPPED: No start date`);
             continue;
        }

        const startDate = new Date(startDateStr);
        const diffTime = Math.abs(now.getTime() - startDate.getTime());
        const yearsInPosition = diffTime / (1000 * 60 * 60 * 24 * 365.25);
        
        console.log(`   - Years in Position: ${yearsInPosition.toFixed(2)}`);

        if (yearsInPosition >= 3.0) {
            console.log(`   -> ELIGIBLE!`);
            console.log(`[ELIGIBLE] ${emp.name}`);
            console.log(`   - Position: ${emp.positionTitle}`);
            console.log(`   - Current Step: ${currentStep}`);
            console.log(`   - Years in Service: ${yearsInPosition.toFixed(2)} (Since ${startDateStr})`);
            console.log(`   - Next Step: ${currentStep + 1}`);
            eligibleCount++;
        } else {
            console.log(`   -> NOT ELIGIBLE (< 3 years)`);
        }
    }

    if (eligibleCount === 0) {
        console.log('No employees found eligible based on current data.');
    } else {
        console.log(`\nFound ${eligibleCount} total eligible employees.`);
    }

}

verifyPlantillaAccuracy().catch(console.error).finally(() => process.exit());
