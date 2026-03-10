import cron from 'node-cron';
import { db } from '../db/index.js';
import { leaveBalances, leaveLedger } from '../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

/**
 * Executes a yearly auto-deduction of 5 Forced Leave days 
 * from the Vacation Leave balance of eligible employees, 
 * as mandated by CSC guidelines (Use it or Lose it).
 */
export const startForcedLeaveCron = () => {
    // Run at 23:59 every December 31st
    cron.schedule('59 23 31 12 *', async () => {
        console.warn('[CRON] Starting Mandatory Forced Leave Deduction...');
        
        try {
            const year = new Date().getFullYear();
            
            // Get all employees with VL >= 10 (CSC rule typically enforces forced leave for 10+ VLs)
            // or simply deduct 5 from everyone with >= 5 VLs if strictly enforced
            const eligibleBalances = await db.query.leaveBalances.findMany({
                where: and(
                    eq(leaveBalances.creditType, 'Vacation Leave'),
                    eq(leaveBalances.year, year),
                    gt(leaveBalances.balance, "4.999") // must have at least 5 days to be deducted 5 days
                )
            });

            for (const record of eligibleBalances) {
                const currentVl = Number(record.balance);
                const deduction = 5;
                const newVl = (currentVl - deduction).toString();

                await db.transaction(async (tx) => {
                    // Update VL balance
                    await tx.update(leaveBalances)
                        .set({ balance: newVl })
                        .where(eq(leaveBalances.id, Number(record.id)));
                        
                    // Log to ledger
                    await tx.insert(leaveLedger).values({
                        employeeId: record.employeeId,
                        creditType: 'Vacation Leave',
                        transactionType: 'FORFEITURE',
                        amount: `-${deduction}`,
                        balanceAfter: newVl,
                        remarks: `Annual auto-deduction of 5 days Forced Leave for ${year}`,
                        createdBy: 'SYSTEM'
                    });
                });
            }
            
            console.warn(`[CRON] Forced Leave Processed completely for ${eligibleBalances.length} eligible employees.`);
        } catch (error) {
            console.error('[CRON] Error executing forced leave deduction:', error);
        }
    });

    console.warn('[CRON] Forced Leave auto-deduction job scheduled (Dec 31, 23:59).');
};
