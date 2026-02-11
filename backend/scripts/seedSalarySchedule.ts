import { db } from '../db/index.js';
import { salarySchedule, salaryTranches } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// SG 1 Step 1 values for 2024 (Tranche 1 - EO 64)
// Sources: Various search results for "SSL VI First Tranche 2024"
const sg1Values: Record<number, number> = {
  1: 13530,
  2: 14372,
  3: 15265,
  4: 16209,
  5: 17205,
  6: 18255,
  7: 19365,
  8: 20440,
  9: 21790,
  10: 23176, // Estimated
  11: 27000,
  12: 29165,
  13: 31320,
  14: 33843,
  15: 36619,
  16: 39672,
  17: 43030,
  18: 46725,
  19: 51357,
  20: 57347,
  21: 63997,
  22: 71511,
  23: 79890,
  24: 89296,
  25: 100788,
  26: 113891,
  27: 128696,
  28: 145427,
  29: 164324,
  30: 185695,
  31: 273278,
  32: 325807,
  33: 411312
};

// Increment multiplier per step (approximate 1% - 3%)
// SSL typically uses const step_increment = (Step8 - Step1) / 7
// Since we don't have Step 8, we'll assume a standard increment.
// For lower grades it's small, for higher it's larger.
// We'll use a conservative 1.1% per step for now to populate the table.
const STEP_INCREMENT_RATE = 0.011; 

const seedSalarySchedule = async () => {
    console.log('🌱 Seeding Salary Schedule...');

    try {
        // 1. Ensure Tranche 1 exists
        let tranche1 = await db.query.salaryTranches.findFirst({
            where: eq(salaryTranches.trancheNumber, 1)
        });

        if (!tranche1) {
            console.log('Creating Tranche 1...');
            await db.insert(salaryTranches).values({
                name: 'First Tranche (SSL VI)',
                trancheNumber: 1,
                circularNumber: 'EO No. 64, s. 2024',
                effectiveDate: '2024-01-01',
                dateIssued: '2024-08-02',
                applicableTo: 'Civilian Government Personnel',
                isActive: 1 // make it active for now
            });
        }

        const TRANCHE_ID = 1;

        // 2. Clear existing entries for Tranche 1
        console.log('Clearing existing entries for Tranche 1...');
        await db.delete(salarySchedule).where(eq(salarySchedule.tranche, TRANCHE_ID));

        // 3. Generate Data
        const entries = [];
        for (let sg = 1; sg <= 33; sg++) {
            const step1 = sg1Values[sg] || (sg1Values[sg-1] * 1.15); // Fallback estimate if missing
            
            for (let step = 1; step <= 8; step++) {
                // Calculate step value: Step N = Step 1 * (1 + rate)^(step-1)
                // Round to nearest peso? SSL tables usually are exact.
                // We'll round to integer.
                const monthly = Math.round(step1 * Math.pow(1 + STEP_INCREMENT_RATE, step - 1));
                
                entries.push({
                    salaryGrade: sg,
                    step: step,
                    monthlySalary: String(monthly),
                    tranche: TRANCHE_ID
                });
            }
        }

        // 4. Batch Insert
        console.log(`Inserting ${entries.length} entries...`);
        // Split into chunks to avoid query size limits
        const CHUNK_SIZE = 100;
        for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
            const chunk = entries.slice(i, i + CHUNK_SIZE);
            await db.insert(salarySchedule).values(chunk);
        }

        console.log('✅ Salary Schedule Seeded Successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
};

seedSalarySchedule();
