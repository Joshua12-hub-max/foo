
import { db } from '../db/index.js';
import { salarySchedule, salaryTranches } from '../db/tables/payroll.js';

const resetTranches = async () => {
    try {
        console.log('Starting Salary Tranche Reset...');

        // 1. Clear Salary Schedule (Child Table)
        console.log('Deleting from salary_schedule...');
        await db.delete(salarySchedule);
        console.log('✅ salary_schedule cleared.');

        // 2. Clear Salary Tranches (Parent Table)
        console.log('Deleting from salary_tranches...');
        await db.delete(salaryTranches);
        console.log('✅ salary_tranches cleared.');

        console.log('🎉 Reset Complete! All tranches have been removed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during reset:', error);
        process.exit(1);
    }
};

resetTranches();
