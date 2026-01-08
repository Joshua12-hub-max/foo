import db from './backend/db/connection.js';

const EMPLOYEE_ID = 'EMP-00873321';
const CREDITS_TO_ADD = [
    { type: 'Vacation Leave', balance: 15 },
    { type: 'Sick Leave', balance: 15 }
];

async function seedCredits() {
    try {
        console.log(`🌱 Seeding credits for ${EMPLOYEE_ID}...`);

        for (const credit of CREDITS_TO_ADD) {
            console.log(`   - Adding ${credit.balance} days of ${credit.type}...`);
            await db.query(`
                INSERT INTO leave_credits (employee_id, credit_type, balance)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE balance = ?
            `, [EMPLOYEE_ID, credit.type, credit.balance, credit.balance]);
        }

        console.log('✅ Credits seeded successfully!');
        process.exit();
    } catch (err) {
        console.error('❌ Error seeding credits:', err);
        process.exit(1);
    }
}

seedCredits();
