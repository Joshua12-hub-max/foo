import { db } from '../db/index.js';
import { dailyTimeRecords } from '../db/schema.js';
import { sql } from 'drizzle-orm';

async function research() {
    try {
        console.log('--- ATTENDANCE STATUS RESEARCH ---');
        
        // 1. Get status counts
        const statusCounts = await db.execute(sql.raw(`
            SELECT status, COUNT(*) as count 
            FROM daily_time_records 
            GROUP BY status
        `));
        console.log('Status Counts:', statusCounts[0]);

        // 2. Find Absent records that have logs
        const suspicious = await db.execute(sql.raw(`
            SELECT dtr.employee_id, dtr.date, dtr.status
            FROM daily_time_records dtr
            WHERE dtr.status = 'Absent'
            AND EXISTS (
                SELECT 1 FROM attendance_logs logs 
                WHERE logs.employee_id = dtr.employee_id 
                AND DATE(logs.scan_time) = dtr.date
            )
            LIMIT 10
        `));
        console.log('Absent records that actually have logs (Sample):', suspicious[0]);
        
        // 3. Find Present/Late records that have NO logs (might be manual or errors)
        const missingLogs = await db.execute(sql.raw(`
            SELECT dtr.employee_id, dtr.date, dtr.status
            FROM daily_time_records dtr
            WHERE dtr.status IN ('Present', 'Late', 'Undertime', 'Late & Undertime')
            AND NOT EXISTS (
                SELECT 1 FROM attendance_logs logs 
                WHERE logs.employee_id = dtr.employee_id 
                AND DATE(logs.scan_time) = dtr.date
            )
            LIMIT 10
        `));
        console.log('Present/Late records that have NO logs (Sample):', missingLogs[0]);

        // 4. Check for records with no time_in/time_out but status is not Absent/Leave
        const noTimes = await db.execute(sql.raw(`
            SELECT dtr.employee_id, dtr.date, dtr.status
            FROM daily_time_records dtr
            WHERE (time_in IS NULL AND time_out IS NULL)
            AND status NOT IN ('Absent', 'Leave', 'Sick Leave', 'Vacation Leave', 'No Logs')
            LIMIT 10
        `));
        console.log('No time_in/out but status is not Absent/Leave (Sample):', noTimes[0]);

        process.exit(0);
    } catch (err) {
        console.error('Research error:', err);
        process.exit(1);
    }
}

research();
