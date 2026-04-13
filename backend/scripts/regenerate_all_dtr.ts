import { db } from '../db/index.js';
import { authentication, bioAttendanceLogs, attendanceLogs } from '../db/schema.js';
import { sql, eq } from 'drizzle-orm';
import { processDailyAttendance } from '../services/attendanceProcessor.js';

async function regenerateAll() {
  try {
    console.log('--- STARTING ALL-EMPLOYEE ATTENDANCE RE-PROCESSING ---');

    // 1. Get all unique Employees found in logs or auth
    const employeesRaw = await db.execute(sql.raw(`
        SELECT DISTINCT employee_id FROM (
            SELECT employee_id FROM attendance_logs
            UNION
            SELECT employee_id FROM authentication WHERE employee_id IS NOT NULL
            UNION
            SELECT employee_id FROM bio_attendance_logs
        ) as all_emps WHERE employee_id LIKE 'Emp-%'
    `)) as any;
    
    const employeeIds = (employeesRaw[0] as { employee_id: string }[]).map(e => e.employee_id);
    console.log(`Found ${employeeIds.length} employee(s) to process.`);

    // 2. Define Date Range (April 9 to Today)
    const startDate = new Date('2026-04-09');
    const endDate = new Date(); // Today
    
    const dates: string[] = [];
    let current = new Date(startDate);
    while (current <= endDate) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    
    console.log(`Processing ${dates.length} days: ${dates.join(', ')}`);

    // 3. Process sequentially to avoid DB lock issues with bulk updates
    for (const dateStr of dates) {
        console.log(`\n--- Processing Date: ${dateStr} ---`);
        for (const empId of employeeIds) {
            try {
                process.stdout.write(`Processing ${empId}... `);
                await processDailyAttendance(empId, dateStr);
                console.log('Done');
            } catch (err) {
                console.log(`Failed: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    }

    console.log('\n--- REGENERATION COMPLETE ---');
    process.exit(0);
  } catch (err) {
    console.error('Regeneration failed:', err);
    process.exit(1);
  }
}

regenerateAll();
