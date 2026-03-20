import { db } from '../db/index.js';
import { accrualRules } from '../db/schema.js';

async function seedAccrualRules() {
    console.log('[SEED] Seeding CSC Accrual Rules...');

    const rules = [
        { daysPresent: '30.000', earnedCredits: '1.250' },
        { daysPresent: '29.500', earnedCredits: '1.229' },
        { daysPresent: '29.000', earnedCredits: '1.208' },
        { daysPresent: '28.500', earnedCredits: '1.188' },
        { daysPresent: '28.000', earnedCredits: '1.167' },
        { daysPresent: '27.500', earnedCredits: '1.146' },
        { daysPresent: '27.000', earnedCredits: '1.125' },
        { daysPresent: '26.500', earnedCredits: '1.104' },
        { daysPresent: '26.000', earnedCredits: '1.083' },
        { daysPresent: '25.500', earnedCredits: '1.063' },
        { daysPresent: '25.000', earnedCredits: '1.042' },
        { daysPresent: '24.500', earnedCredits: '1.021' },
        { daysPresent: '24.000', earnedCredits: '1.000' },
        { daysPresent: '23.500', earnedCredits: '0.979' },
        { daysPresent: '23.000', earnedCredits: '0.958' },
        { daysPresent: '22.500', earnedCredits: '0.938' },
        { daysPresent: '22.000', earnedCredits: '0.917' },
        { daysPresent: '21.500', earnedCredits: '0.896' },
        { daysPresent: '21.000', earnedCredits: '0.875' },
        { daysPresent: '20.500', earnedCredits: '0.854' },
        { daysPresent: '20.000', earnedCredits: '0.833' },
        { daysPresent: '19.500', earnedCredits: '0.813' },
        { daysPresent: '19.000', earnedCredits: '0.792' },
        { daysPresent: '18.500', earnedCredits: '0.771' },
        { daysPresent: '18.000', earnedCredits: '0.750' },
        { daysPresent: '17.500', earnedCredits: '0.729' },
        { daysPresent: '17.000', earnedCredits: '0.708' },
        { daysPresent: '16.500', earnedCredits: '0.687' },
        { daysPresent: '16.000', earnedCredits: '0.667' },
        { daysPresent: '15.500', earnedCredits: '0.646' },
        { daysPresent: '15.000', earnedCredits: '0.625' },
        { daysPresent: '14.500', earnedCredits: '0.604' },
        { daysPresent: '14.000', earnedCredits: '0.583' },
        { daysPresent: '13.500', earnedCredits: '0.562' },
        { daysPresent: '13.000', earnedCredits: '0.542' },
        { daysPresent: '12.500', earnedCredits: '0.521' },
        { daysPresent: '12.000', earnedCredits: '0.500' },
        { daysPresent: '11.500', earnedCredits: '0.479' },
        { daysPresent: '11.000', earnedCredits: '0.458' },
        { daysPresent: '10.500', earnedCredits: '0.438' },
        { daysPresent: '10.000', earnedCredits: '0.417' },
        { daysPresent: '9.500', earnedCredits: '0.396' },
        { daysPresent: '9.000', earnedCredits: '0.375' },
        { daysPresent: '8.500', earnedCredits: '0.354' },
        { daysPresent: '8.000', earnedCredits: '0.333' },
        { daysPresent: '7.500', earnedCredits: '0.312' },
        { daysPresent: '7.000', earnedCredits: '0.292' },
        { daysPresent: '6.500', earnedCredits: '0.271' },
        { daysPresent: '6.000', earnedCredits: '0.250' },
        { daysPresent: '5.500', earnedCredits: '0.229' },
        { daysPresent: '5.000', earnedCredits: '0.208' },
        { daysPresent: '4.500', earnedCredits: '0.187' },
        { daysPresent: '4.000', earnedCredits: '0.167' },
        { daysPresent: '3.500', earnedCredits: '0.146' },
        { daysPresent: '3.000', earnedCredits: '0.125' },
        { daysPresent: '2.500', earnedCredits: '0.104' },
        { daysPresent: '2.000', earnedCredits: '0.083' },
        { daysPresent: '1.500', earnedCredits: '0.062' },
        { daysPresent: '1.000', earnedCredits: '0.042' },
        { daysPresent: '0.000', earnedCredits: '0.000' }
    ].map(r => ({ ...r, ruleType: 'CSC_STANDARD' }));

    try {
        await db.delete(accrualRules);
        await db.insert(accrualRules).values(rules);
        console.log(`[SEED] Successfully seeded ${rules.length} accrual rules.`);
    } catch (error) {
        console.error('[SEED] Error seeding accrual rules:', error);
    } finally {
        process.exit(0);
    }
}

seedAccrualRules();
