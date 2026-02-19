import cron from 'node-cron';
import { accrueCreditsForMonth } from '../services/leaveAccrualService.js';

export const initLeaveAccrualJob = () => {
  // Run at 00:00 on the 1st day of every month
  // Cron format: Minute Hour DayMonth Month DayWeek
  cron.schedule('0 0 1 * *', async () => {
    const today = new Date();
    // We accrue for the PREVIOUS month on the 1st of current month?
    // Or accrue for current month?
    // Usually accrual happens at end of month or start of next.
    // Let's assume start of next month processes previous month.
    
    // Logic: If today is Feb 1st, we process Jan.
    let year = today.getFullYear();
    let month = today.getMonth(); // 0-11. Jan is 0.
    
    // If today is Jan 1st (month=0), we want Dec of prev year.
    if (month === 0) {
        month = 12; // Dec
        year -= 1;
    }
    
    console.log(`[CRON] Starting Monthly Leave Accrual for ${month}/${year}...`);
    
    try {
        const result = await accrueCreditsForMonth(month, year);
        console.log(`[CRON] Leave Accrual Completed: Processed ${result.processedCount} employees.`);
    } catch (error) {
        console.error('[CRON] Leave Accrual Failed:', error);
    }
  });
  
  console.log('Leave Accrual Cron Job initialized (Monthly on 1st at 00:00)');
};
