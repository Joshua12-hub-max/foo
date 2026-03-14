import { db } from '../db/index.js';
import { attendanceLogs, schedules, dailyTimeRecords, internalPolicies, authentication, leaveApplications } from '../db/schema.js';
import { eq, and, asc, sql } from 'drizzle-orm';
import { updateTardinessSummary } from '../utils/tardinessUtils.js';
import { formatToManilaDateTime } from '../utils/dateUtils.js';
import { checkPolicyViolations } from './violationService.js';
import { compareIds } from '../utils/idUtils.js';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/**
 * Parse time string "HH:MM:SS" into components
 */
const parseTimeString = (timeStr: string): [number, number, number] => {
  const parts = timeStr.split(':').map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
};

interface TardinessPolicy {
  gracePeriod?: string | number;
}

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
      compareIds(attendanceLogs.employeeId, employeeId),
      eq(sql`DATE(${attendanceLogs.scanTime})`, dateStr)
    ))
    .orderBy(asc(attendanceLogs.scanTime));

    // 2. Get Employee Duty Info
    const employees = await db.select({
      dutyType: authentication.dutyType,
      dailyTargetHours: authentication.dailyTargetHours
    })
    .from(authentication)
    .where(compareIds(authentication.employeeId, employeeId))
    .limit(1);

    // 2b. Check for Approved Leave
    const approvedLeaves = await db.select({
      leaveType: leaveApplications.leaveType
    })
    .from(leaveApplications)
    .where(and(
      compareIds(leaveApplications.employeeId, employeeId),
      eq(leaveApplications.status, 'Approved'),
      sql`DATE(${leaveApplications.startDate}) <= ${dateStr}`,
      sql`DATE(${leaveApplications.endDate}) >= ${dateStr}`
    ))
    .limit(1);
    
    const isOnLeave = approvedLeaves.length > 0;
    const leaveType = isOnLeave ? approvedLeaves[0].leaveType : null;

    const dutyType = employees[0]?.dutyType || 'Standard';
    const dailyTargetHours = Number(employees[0]?.dailyTargetHours) || 8;
    const dailyTargetMinutes = dailyTargetHours * 60;
    const LUNCH_BREAK_MINUTES = 60; // 1 hour lunch deduction for rendered time calc

    // 3. Get Schedule(s)
    const dateParts = dateStr.split('-').map(Number);
    const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const dayName = DAYS_OF_WEEK[dateObj.getDay()];

    let scheduleBlocks = await db.select({
      startTime: schedules.startTime,
      endTime: schedules.endTime
    })
    .from(schedules)
    .where(and(
      compareIds(schedules.employeeId, employeeId),
      eq(schedules.dayOfWeek, dayName)
    ))
    .orderBy(asc(schedules.startTime));

    // Track whether we're using target-hours mode (Irregular with no schedule)
    let useTargetHoursMode = false;

    // Fallback logic based on Duty Type
    if (scheduleBlocks.length === 0) {
      if (dutyType === 'Standard') {
         // Standard is Mon-Fri
         const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';
         if (!isWeekend) {
            scheduleBlocks = [{
              startTime: '08:00:00',
              endTime: '17:00:00'
            }];
         }
      } else {
         // Irregular: No fixed start/end time. Use dailyTargetHours to calculate undertime.
         // Late is NOT applicable (no fixed arrival time).
         // Undertime = dailyTargetMinutes - renderedMinutes (if renderedMinutes < target).
         useTargetHoursMode = true;
      }
    }

    // Filter out rest days for logic calculation
    // Since isRestDay column is removed, we treat all fetched schedules as active (isRestDay = 0/false)
    const activeBlocks = scheduleBlocks.map(b => ({ ...b, isRestDay: 0 }));
    
    // 1b. Fetch Tardiness Policy (Grace Period)
    let gracePeriod = 0;
    try {
      const policyRows = await db.select().from(internalPolicies).where(eq(internalPolicies.category, 'tardiness')).limit(1);
      const policyRow = policyRows[0];
      
      if (policyRow?.content) {
        const content = (typeof policyRow.content === 'string' ? JSON.parse(policyRow.content) : policyRow.content) as TardinessPolicy;
        gracePeriod = Number(content.gracePeriod) || 0;
      }
    } catch (_e: unknown) {
      console.warn('[ATTENDANCE] Error fetching tardiness policy (defaulting to 0):', _e);
    }
    
    let totalLateMinutes = 0;
    let totalUndertimeMinutes = 0;
    let totalOvertimeMinutes = 0;
    let timeIn: Date | null = null;
    let timeOut: Date | null = null;

    if (activeBlocks.length > 0) {
      // ── SCHEDULE-BASED MODE (Standard or Irregular with explicit schedule) ──
      // Map logs to blocks
      // For each block, find the best IN (closest to startTime) and OUT (closest to endTime)
      for (const block of activeBlocks) {
        const blockStart = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const [sH, sM, sS] = parseTimeString(block.startTime);
        blockStart.setHours(sH, sM, sS);

        const blockEnd = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const [eH, eM, eS] = parseTimeString(block.endTime);
        blockEnd.setHours(eH, eM, eS);

        // Find applicable logs for this block
        // Threshold: Look for logs within 10 hours of the block start/end
        // Increased from 4h to 10h to capture early OUTs (like 11 AM for a 5 PM shift)
        const thresholdMs = 10 * 60 * 60 * 1000;

        const blockInLogs = logs.filter(l => 
          l.type === 'IN' && 
          Math.abs(new Date(l.scanTime).getTime() - blockStart.getTime()) <= thresholdMs
        );
        
        const blockOutLogs = logs.filter(l => 
          l.type === 'OUT' && 
          Math.abs(new Date(l.scanTime).getTime() - blockEnd.getTime()) <= thresholdMs
        );

        if (blockInLogs.length > 0) {
          const firstIn = new Date(blockInLogs[0].scanTime);
          if (!timeIn || firstIn < timeIn) timeIn = firstIn;
          
          if (firstIn > blockStart) {
            const minutesLate = Math.floor((firstIn.getTime() - blockStart.getTime()) / 60000);
            // L1 FIX: Grace period deducts from late minutes, not just gates them
            // If grace = 15 and late = 20, charge 5 (not 20)
            if (minutesLate > gracePeriod) {
              totalLateMinutes += (minutesLate - gracePeriod);
            }
          }
        }

        if (blockOutLogs.length > 0) {
          const lastOut = new Date(blockOutLogs[blockOutLogs.length - 1].scanTime);
          if (!timeOut || lastOut > timeOut) timeOut = lastOut;

          if (lastOut < blockEnd) {
            totalUndertimeMinutes += Math.floor((blockEnd.getTime() - lastOut.getTime()) / 60000);
          } else if (lastOut > blockEnd) {
            totalOvertimeMinutes += Math.floor((lastOut.getTime() - blockEnd.getTime()) / 60000);
          }
        }
      }
    } else if (useTargetHoursMode && logs.length > 0) {
      // ── TARGET-HOURS MODE (Irregular with no schedule) ──
      // No fixed start/end time → Late is NOT computed (no arrival benchmark).
      // Undertime = dailyTargetMinutes - renderedMinutes (if short).
      const inLogs = logs.filter(l => l.type === 'IN');
      const outLogs = logs.filter(l => l.type === 'OUT');

      if (inLogs.length > 0) timeIn = new Date(inLogs[0].scanTime);
      if (outLogs.length > 0) timeOut = new Date(outLogs[outLogs.length - 1].scanTime);

      if (timeIn && timeOut) {
        const grossRenderedMinutes = Math.floor((timeOut.getTime() - timeIn.getTime()) / 60000);
        // Deduct 1 hour lunch if rendered > 5 hours (standard govt rule)
        const lunchDeduction = grossRenderedMinutes > 300 ? LUNCH_BREAK_MINUTES : 0;
        const netRenderedMinutes = grossRenderedMinutes - lunchDeduction;

        if (netRenderedMinutes < dailyTargetMinutes) {
          totalUndertimeMinutes = dailyTargetMinutes - netRenderedMinutes;
        } else if (netRenderedMinutes > dailyTargetMinutes) {
          totalOvertimeMinutes = netRenderedMinutes - dailyTargetMinutes;
        }
        // Late is NOT applicable in target-hours mode (no fixed start time)
      }
    } else {
      // Rest Day or no logs at all: Just record first in and last out
      const inLogs = logs.filter(l => l.type === 'IN');
      const outLogs = logs.filter(l => l.type === 'OUT');
      if (inLogs.length > 0) timeIn = new Date(inLogs[0].scanTime);
      if (outLogs.length > 0) timeOut = new Date(outLogs[outLogs.length - 1].scanTime);
    }

    // ── STATUS DETERMINATION ──
    let status: string = 'Pending';
    const hasScheduleOrTarget = activeBlocks.length > 0 || useTargetHoursMode;

    if (hasScheduleOrTarget) {
      if (!timeIn && logs.length === 0) {
        // No logs at all for a working day
        status = isOnLeave ? (leaveType || 'Leave') : (useTargetHoursMode ? 'No Logs' : 'Absent');
      } else if (!timeIn) {
        status = isOnLeave ? (leaveType || 'Leave') : 'Absent';
      } else {
        const isLate = totalLateMinutes > 0;
        const isUndertime = totalUndertimeMinutes > 0;
        
        if (isLate && isUndertime) {
          status = 'Late/Undertime';
        } else if (isLate) {
          status = 'Late';
        } else if (isUndertime) {
          status = 'Undertime';
        } else {
          status = 'Present';
        }
      }
    }

    // 4. Upsert into daily_time_records ONLY if there are logs or the employee is on leave
    // If they simply never clocked in (Absent), we do not create a DTR row, keeping the table clean as requested.
    if (logs.length > 0 || isOnLeave) {
      await db.insert(dailyTimeRecords).values({
        employeeId,
        date: dateStr,
        timeIn: timeIn ? formatToManilaDateTime(timeIn) : null,
        timeOut: timeOut ? formatToManilaDateTime(timeOut) : null,
        lateMinutes: totalLateMinutes,
      undertimeMinutes: totalUndertimeMinutes,
      overtimeMinutes: totalOvertimeMinutes,
      status,
      updatedAt: sql`CURRENT_TIMESTAMP`
      }).onDuplicateKeyUpdate({
        set: {
          timeIn: timeIn ? formatToManilaDateTime(timeIn) : null,
          timeOut: timeOut ? formatToManilaDateTime(timeOut) : null,
          lateMinutes: totalLateMinutes,
          undertimeMinutes: totalUndertimeMinutes,
          overtimeMinutes: totalOvertimeMinutes,
          status,
          updatedAt: sql`CURRENT_TIMESTAMP`
        }
      });
    }

    // 5. AUTO-UPDATE SUMMARY & CHECK VIOLATIONS
    // This makes the system "Real-Time"
    await updateTardinessSummary(employeeId, dateStr);
    
    // Only check for violations if there's a negative incident to save resources
    if (totalLateMinutes > 0 || totalUndertimeMinutes > 0 || status === 'Absent') {
      const dateParts = dateStr.split('-').map(Number);
      await checkPolicyViolations(employeeId, dateParts[0], dateParts[1]);
    }

    // console.log(`Processed DTR for ${employeeId} on ${dateStr}: Late=${totalLateMinutes}, Undertime=${totalUndertimeMinutes}`);
  } catch (error: unknown) {
    console.error('Error processing daily attendance:', error);
    throw error;
  }
};
