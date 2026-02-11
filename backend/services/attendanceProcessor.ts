import { db } from '../db/index.js';
import { attendanceLogs, schedules, dailyTimeRecords } from '../db/schema.js';
import { eq, and, asc, sql } from 'drizzle-orm';

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
    const logs = await db.select({
      scanTime: attendanceLogs.scanTime,
      type: attendanceLogs.type
    })
    .from(attendanceLogs)
    .where(and(
      eq(attendanceLogs.employeeId, employeeId),
      eq(sql`DATE(${attendanceLogs.scanTime})`, dateStr)
    ))
    .orderBy(asc(attendanceLogs.scanTime));

    if (logs.length === 0) return;

    // 2. Determine Time In and Time Out
    // Rule: First IN is Time In. Last OUT is Time Out.
    let timeIn: Date | null = null;
    let timeOut: Date | null = null;

    const inLogs = logs.filter((l) => l.type === 'IN');
    if (inLogs.length > 0) {
      // Drizzle scanTime might be Date or string depending on driver/schema, assuming Date from schema
      timeIn = new Date(inLogs[0].scanTime); 
    }

    const outLogs = logs.filter((l) => l.type === 'OUT');
    if (outLogs.length > 0) {
      timeOut = new Date(outLogs[outLogs.length - 1].scanTime);
    }

    // 3. Get Schedule to calculate Late / Undertime
    const dateParts = dateStr.split('-').map(Number);
    // month is 0-indexed in Date constructor
    const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayName = DAYS_OF_WEEK[dateObj.getDay()];

    const scheduled = await db.query.schedules.findFirst({
      where: and(
        eq(schedules.employeeId, employeeId),
        eq(schedules.dayOfWeek, dayName)
      ),
      columns: { startTime: true, endTime: true, isRestDay: true }
    });

    let lateMinutes = 0;
    let undertimeMinutes = 0;
    let status = 'Present';

    if (scheduled && !scheduled.isRestDay) {
      // Construct Schedule Date Objects using local components
      const scheduleStart = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const [startH, startM, startS] = parseTimeString(scheduled.startTime);
      scheduleStart.setHours(startH, startM, startS);

      const scheduleEnd = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const [endH, endM, endS] = parseTimeString(scheduled.endTime);
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
    await db.insert(dailyTimeRecords).values({
      employeeId,
      date: dateStr,
      timeIn: timeIn ? timeIn.toISOString() : null,
      timeOut: timeOut ? timeOut.toISOString() : null,
      lateMinutes,
      undertimeMinutes,
      status,
      updatedAt: new Date().toISOString() // Or let default handle it if set
    }).onDuplicateKeyUpdate({
      set: {
        timeIn: timeIn ? timeIn.toISOString() : null,
        timeOut: timeOut ? timeOut.toISOString() : null,
        lateMinutes,
        undertimeMinutes,
        status,
        updatedAt: new Date().toISOString()
      }
    });

    console.log(`Processed DTR for ${employeeId} on ${dateStr}: Late=${lateMinutes}, Undertime=${undertimeMinutes}`);
  } catch (error) {
    console.error('Error processing daily attendance:', error);
    throw error;
  }
};