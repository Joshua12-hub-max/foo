import db from '../db/connection.js';
import type { RowDataPacket } from 'mysql2/promise';

/**
 * Attendance log record from database
 */
interface AttendanceLog extends RowDataPacket {
  scan_time: Date;
  type: 'IN' | 'OUT';
}

/**
 * Schedule record from database
 */
interface ScheduleRow extends RowDataPacket {
  start_time: string;
  end_time: string;
  is_rest_day: boolean;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/**
 * Parse time string "HH:MM:SS" into components
 */
const parseTimeString = (timeStr: string): [number, number, number] => {
  const parts = timeStr.split(':').map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
};

/**
 * Core logic to process attendance logs into a Daily Time Record.
 * Calculates Late, Undertime, and updates the status.
 * Call this function whenever a new log is inserted.
 * 
 * @param employeeId - The employee ID
 * @param dateStr - Date in YYYY-MM-DD format
 */
export const processDailyAttendance = async (
  employeeId: string,
  dateStr: string
): Promise<void> => {
  try {
    // 1. Get all logs for the day
    const [logs] = await db.query<AttendanceLog[]>(
      'SELECT scan_time, type FROM attendance_logs WHERE employee_id = ? AND DATE(scan_time) = ? ORDER BY scan_time ASC',
      [employeeId, dateStr]
    );

    if (logs.length === 0) return;

    // 2. Determine Time In and Time Out
    // Rule: First IN is Time In. Last OUT is Time Out.
    let timeIn: Date | null = null;
    let timeOut: Date | null = null;

    const inLogs = logs.filter((l) => l.type === 'IN');
    if (inLogs.length > 0) {
      timeIn = inLogs[0].scan_time; // Earliest IN
    }

    const outLogs = logs.filter((l) => l.type === 'OUT');
    if (outLogs.length > 0) {
      timeOut = outLogs[outLogs.length - 1].scan_time; // Latest OUT
    }

    // 3. Get Schedule to calculate Late / Undertime
    const dateParts = dateStr.split('-').map(Number);
    // month is 0-indexed in Date constructor
    const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayName = DAYS_OF_WEEK[dateObj.getDay()];

    const [schedules] = await db.query<ScheduleRow[]>(
      'SELECT start_time, end_time, is_rest_day FROM schedules WHERE employee_id = ? AND day_of_week = ?',
      [employeeId, dayName]
    );

    let lateMinutes = 0;
    let undertimeMinutes = 0;
    let status = 'Present';

    if (schedules.length > 0 && !schedules[0].is_rest_day) {
      const schedule = schedules[0];

      // Construct Schedule Date Objects using local components
      const scheduleStart = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const [startH, startM, startS] = parseTimeString(schedule.start_time);
      scheduleStart.setHours(startH, startM, startS);

      const scheduleEnd = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const [endH, endM, endS] = parseTimeString(schedule.end_time);
      scheduleEnd.setHours(endH, endM, endS);

      // Calculate Late
      if (timeIn && timeIn > scheduleStart) {
        const diffMs = timeIn.getTime() - scheduleStart.getTime();
        lateMinutes = Math.floor(diffMs / (1000 * 60));
      }

      // Calculate Undertime (Only if clocked out)
      if (timeOut && timeOut < scheduleEnd) {
        const diffMs = scheduleEnd.getTime() - timeOut.getTime();
        undertimeMinutes = Math.floor(diffMs / (1000 * 60));
      }
    }

    // Determine Status Label
    if (lateMinutes > 0) {
      status = 'Late';
    }

    // 4. Upsert into daily_time_records
    await db.query(
      `INSERT INTO daily_time_records 
       (employee_id, date, time_in, time_out, late_minutes, undertime_minutes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       time_in = VALUES(time_in),
       time_out = VALUES(time_out),
       late_minutes = VALUES(late_minutes),
       undertime_minutes = VALUES(undertime_minutes),
       status = VALUES(status),
       updated_at = CURRENT_TIMESTAMP`,
      [employeeId, dateStr, timeIn, timeOut, lateMinutes, undertimeMinutes, status]
    );

    console.log(`Processed DTR for ${employeeId} on ${dateStr}: Late=${lateMinutes}, Undertime=${undertimeMinutes}`);
  } catch (error) {
    console.error('Error processing daily attendance:', error);
    throw error;
  }
};
