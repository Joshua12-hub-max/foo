import { db } from '../db/index.js';
import { employeeMemos } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function fixMemoDates() {
  console.log('Fixing memo dates based on content...');
  try {
    const memos = await db.select().from(employeeMemos);
    
    let updatedCount = 0;
    for (const memo of memos) {
      if (!memo.content) continue;
      
      // Look for "attendance records for 1/2026" or "2/2026"
      const match = memo.content.match(/attendance records for (\d+)\/(\d+)/);
      if (match) {
        const month = parseInt(match[1], 10);
        const year = parseInt(match[2], 10);
        
        // Let's set the date to the 28th (or last day) of that month
        // We'll just use the 20th of the month at 10 AM to be safe and avoid timezone zero issues at end of month
        const historicalDateStr = new Date(year, month - 1, 20, 10, 0, 0).toISOString().replace('T', ' ').slice(0, 19);
        const effectiveDateStr = new Date(year, month - 1, 20).toISOString().split('T')[0];

        await db.update(employeeMemos)
          .set({ 
            createdAt: historicalDateStr,
            effectiveDate: effectiveDateStr 
          })
          .where(eq(employeeMemos.id, memo.id));
          
        updatedCount++;
      }
    }
    console.log(`Successfully updated the dates of ${updatedCount} memos to match their violation month!`);
  } catch (error) {
    console.error('Error fixing dates:', error);
  } finally {
    process.exit(0);
  }
}

fixMemoDates();
