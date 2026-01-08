import db from '../db/connection.js';

/**
 * Para sa Core logic to process attendance logs into a Daily Time Record.
 * Para sa Calculates Late, Undertime, and updates the status.
 * Para sa Call this function whenever a new log is inserted.
 */
export const processDailyAttendance = async (employeeId, dateStr) => {
    try {
        // 1. Get all logs for the day
        const [logs] = await db.query(
            "SELECT scan_time, type FROM attendance_logs WHERE employee_id = ? AND DATE(scan_time) = ? ORDER BY scan_time ASC",
            [employeeId, dateStr]
        );

        if (logs.length === 0) return;

        // 2. to Determine Time In and Time Out
        // Rule: First IN is Time In. Last OUT is Time Out.
        let timeIn = null;
        let timeOut = null;

        const inLogs = logs.filter(l => l.type === 'IN');
        if (inLogs.length > 0) timeIn = inLogs[0].scan_time; // Earliest IN

        const outLogs = logs.filter(l => l.type === 'OUT');
        if (outLogs.length > 0) timeOut = outLogs[outLogs.length - 1].scan_time; // Latest OUT

        // 3. Get Schedule to calculate Late / Undertime
        // Use a more robust way to get Day Name from YYYY-MM-DD
        const dateParts = dateStr.split('-').map(Number);
        // month is 0-indexed in Date constructor
        const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[dateObj.getDay()];

        const [schedules] = await db.query(
            "SELECT start_time, end_time, is_rest_day FROM schedules WHERE employee_id = ? AND day_of_week = ?",
            [employeeId, dayName]
        );

        let lateMinutes = 0;
        let undertimeMinutes = 0;
        let status = 'Present';

        if (schedules.length > 0 && !schedules[0].is_rest_day) {
            const schedule = schedules[0];

            // Construct Schedule Date Objects using local components
            const scheduleStart = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            const [startH, startM, startS] = schedule.start_time.split(':').map(Number);
            scheduleStart.setHours(startH, startM, startS || 0);

            const scheduleEnd = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            const [endH, endM, endS] = schedule.end_time.split(':').map(Number);
            scheduleEnd.setHours(endH, endM, endS || 0);

            // Calculate Late
            if (timeIn && timeIn > scheduleStart) {
                const diffMs = timeIn - scheduleStart;
                lateMinutes = Math.floor(diffMs / (1000 * 60));
            }

            // Calculate Undertime (Only if clocked out)
            if (timeOut && timeOut < scheduleEnd) {
                const diffMs = scheduleEnd - timeOut;
                undertimeMinutes = Math.floor(diffMs / (1000 * 60));
            }
        }

        // Determine Status Label
        if (lateMinutes > 0) status = 'Late';
        // You could add more logic here (e.g., if undertime > 4 hours, mark as Half Day?)
        // For now, keeping it simple.

        // 4. Upsert into daily_time_records
        // We use ON DUPLICATE KEY UPDATE to refresh calculations if new logs come in (e.g., a later Clock Out)
        await db.query(`
            INSERT INTO daily_time_records 
            (employee_id, date, time_in, time_out, late_minutes, undertime_minutes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            time_in = VALUES(time_in),
            time_out = VALUES(time_out),
            late_minutes = VALUES(late_minutes),
            undertime_minutes = VALUES(undertime_minutes),
            status = VALUES(status),
            updated_at = CURRENT_TIMESTAMP
        `, [employeeId, dateStr, timeIn, timeOut, lateMinutes, undertimeMinutes, status]);

        console.log(`Processed DTR for ${employeeId} on ${dateStr}: Late=${lateMinutes}, Undertime=${undertimeMinutes}`);

    } catch (error) {
        console.error("Error processing daily attendance:", error);
        throw error;
    }
};
