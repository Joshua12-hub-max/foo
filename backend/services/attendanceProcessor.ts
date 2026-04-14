import { db } from '../db/index.js';
import { attendanceLogs, schedules, dailyTimeRecords, internalPolicies, authentication, leaveApplications, pdsHrDetails } from '../db/schema.js';
import { eq, and, asc, sql, or } from 'drizzle-orm';
import { updateTardinessSummary } from '../utils/tardinessUtils.js';
import { formatToManilaDateTime } from '../utils/dateUtils.js';
import { checkPolicyViolations } from './violationService.js';
import { compareIds, normalizeIdJs } from '../utils/idUtils.js';
import { calculateLateUndertime, determineStatus } from '../utils/attendanceUtils.js';

import * as leaveService from './leaveService.js';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

/**
 * Parse time string "HH:MM:SS" into components
 */
const parseTimeString = (timeStr: string): [number, number, number] => {
  const parts = timeStr.split(':').map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
};

interface TardinessPolicyContent {
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
      dutyType: pdsHrDetails.dutyType,
      dailyTargetHours: pdsHrDetails.dailyTargetHours,
      startTime: pdsHrDetails.startTime,
      endTime: pdsHrDetails.endTime
    })
    .from(authentication)
    .leftJoin(pdsHrDetails, eq(authentication.id, pdsHrDetails.employeeId))
    .where(compareIds(authentication.employeeId, employeeId))
    .limit(1);

    // 2a. Fetch System Default Shift
    const systemDefaultShift = await leaveService.getDefaultShift();

    const defaultStart = systemDefaultShift.startTime || '08:00:00';
    const defaultEnd = systemDefaultShift.endTime || '17:00:00';

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
    const empDefaultStart = employees[0]?.startTime || defaultStart;
    const empDefaultEnd = employees[0]?.endTime || defaultEnd;
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
      eq(schedules.dayOfWeek, dayName),
      or(sql`${schedules.startDate} IS NULL`, sql`${schedules.startDate} <= ${dateStr}`),
      or(sql`${schedules.endDate} IS NULL`, sql`${schedules.endDate} >= ${dateStr}`)
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
              startTime: empDefaultStart,
              endTime: empDefaultEnd
            }];
         }
      } else {
         // Irregular: No fixed start/end time. Use dailyTargetHours to calculate undertime.
         useTargetHoursMode = true;
      }
    }

    // Filter out rest days for logic calculation
    const activeBlocks = scheduleBlocks.map(b => ({ ...b, isRestDay: 0 }));
    
    // 1b. Fetch Tardiness Policy (Grace Period)
    let gracePeriod = 0;
    try {
      const policyRows = await db.select().from(internalPolicies).where(eq(internalPolicies.category, 'tardiness')).limit(1);
      const policyRow = policyRows[0];
      
      if (policyRow?.content) {
        const content = (typeof policyRow.content === 'string' ? JSON.parse(policyRow.content) : policyRow.content) as TardinessPolicyContent;
        gracePeriod = Number(content.gracePeriod) || 0;
      }
    } catch (_e: Error | unknown) {
      const msg = _e instanceof Error ? _e.message : String(_e);
      console.warn(`[ATTENDANCE] Error fetching tardiness policy for ${employeeId}:`, msg);
    }
    
    let totalLateMinutes = 0;
    let totalUndertimeMinutes = 0;
    let totalOvertimeMinutes = 0;
    let timeIn: Date | null = null;
    let timeOut: Date | null = null;

    if (activeBlocks.length > 0) {
      // ── SCHEDULE-BASED MODE (Standard or Irregular with explicit schedule) ──
      for (const block of activeBlocks) {
        const blockStart = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const [sH, sM, sS] = parseTimeString(block.startTime);
        blockStart.setHours(sH, sM, sS);

        const blockEnd = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const [eH, eM, eS] = parseTimeString(block.endTime);
        blockEnd.setHours(eH, eM, eS);

        const thresholdMs = 10 * 60 * 60 * 1000;

        const blockInLogs = logs.filter(l => 
          l.type === 'IN' && 
          Math.abs(new Date(l.scanTime).getTime() - blockStart.getTime()) <= thresholdMs
        );
        
        const blockOutLogs = logs.filter(l => 
          l.type === 'OUT' && 
          Math.abs(new Date(l.scanTime).getTime() - blockEnd.getTime()) <= thresholdMs
        );

        if (blockInLogs.length > 0 || blockOutLogs.length > 0) {
          const firstIn = blockInLogs.length > 0 ? new Date(blockInLogs[0].scanTime) : null;
          const lastOut = blockOutLogs.length > 0 ? new Date(blockOutLogs[blockOutLogs.length - 1].scanTime) : null;

          if (firstIn && (!timeIn || firstIn < timeIn)) timeIn = firstIn;
          if (lastOut && (!timeOut || lastOut > timeOut)) timeOut = lastOut;

          const { lateMinutes, undertimeMinutes } = calculateLateUndertime(
            firstIn,
            lastOut,
            blockStart,
            blockEnd,
            gracePeriod
          );

          totalLateMinutes += lateMinutes;
          totalUndertimeMinutes += undertimeMinutes;

          if (lastOut && lastOut > blockEnd) {
            totalOvertimeMinutes += Math.floor((lastOut.getTime() - blockEnd.getTime()) / 60000);
          }
        }
      }
    } else if (useTargetHoursMode && logs.length > 0) {
      // ── TARGET-HOURS MODE ──
      const targetInLogs = logs.filter(l => l.type === 'IN');
      const targetOutLogs = logs.filter(l => l.type === 'OUT');

      if (targetInLogs.length > 0) timeIn = new Date(targetInLogs[0].scanTime);
      if (targetOutLogs.length > 0) timeOut = new Date(targetOutLogs[targetOutLogs.length - 1].scanTime);

      if (timeIn && timeOut) {
        const grossRenderedMinutes = Math.floor((timeOut.getTime() - timeIn.getTime()) / 60000);
        const lunchDeduction = grossRenderedMinutes > 300 ? LUNCH_BREAK_MINUTES : 0;
        const netRenderedMinutes = grossRenderedMinutes - lunchDeduction;

        if (netRenderedMinutes < dailyTargetMinutes) {
          totalUndertimeMinutes = dailyTargetMinutes - netRenderedMinutes;
        } else if (netRenderedMinutes > dailyTargetMinutes) {
          totalOvertimeMinutes = netRenderedMinutes - dailyTargetMinutes;
        }
      }
    } else {
      // Rest Day or no logs at all: Just record first in and last out
      const fallbackInLogs = logs.filter(l => l.type === 'IN');
      const fallbackOutLogs = logs.filter(l => l.type === 'OUT');
      if (fallbackInLogs.length > 0) timeIn = new Date(fallbackInLogs[0].scanTime);
      if (fallbackOutLogs.length > 0) timeOut = new Date(fallbackOutLogs[fallbackOutLogs.length - 1].scanTime);
    }

    // ── STATUS DETERMINATION ──
    const hasScheduleOrTarget = activeBlocks.length > 0 || useTargetHoursMode;
    
    // Determine if the shift is still active based on the last block or current time
    let isShiftActive = false;
    if (activeBlocks.length > 0) {
        const lastBlock = activeBlocks[activeBlocks.length - 1];
        const blockEnd = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const [eH, eM, eS] = parseTimeString(lastBlock.endTime);
        blockEnd.setHours(eH, eM, eS);
        isShiftActive = new Date() < blockEnd;
    }

    // 100% PRECISION: If the shift is still active, undertime is NOT yet calculable.
    if (isShiftActive && timeOut === null) {
        totalUndertimeMinutes = 0;
    }

    // 100% PRECISION: Correctly handle Rest Day Duty to eliminate "Pending" artifacts
    let status = determineStatus(
      totalLateMinutes,
      totalUndertimeMinutes,
      'Present',
      hasScheduleOrTarget,
      isShiftActive,
      timeOut !== null,
      timeIn ? formatToManilaDateTime(timeIn) : null, 
      timeOut ? formatToManilaDateTime(timeOut) : null
    );

    if (hasScheduleOrTarget) {
      if (!timeIn && logs.length === 0) {
        status = isOnLeave ? (leaveType || 'Leave') : (useTargetHoursMode ? 'No Logs' : 'Absent');
      } else if (!timeIn) {
        status = isOnLeave ? (leaveType || 'Leave') : 'Absent';
      }
    } else if (isOnLeave) {
      status = leaveType || 'Leave';
    }

    // 4. Upsert based on a more resilient logic.
    // If logs exist, a record MUST be created.
    if (logs.length > 0) {
      let finalStatus = status;

      // If there's no schedule, but they logged in, it needs manual review.
      if (!hasScheduleOrTarget) {
        finalStatus = 'Needs Review';
      }

      // The "Noise Filter" might be too aggressive. For now, we will record
      // these logs for review instead of discarding them.
      if (!hasScheduleOrTarget && !isOnLeave && timeIn !== null && timeOut !== null) {
        const inHour = timeIn.getHours();
        if (inHour === 0 || inHour === 23) {
          finalStatus = 'Needs Review (Noise)';
        }
      }
      
      const normalizedTargetId = normalizeIdJs(employeeId);
      await db.insert(dailyTimeRecords).values({
        employeeId: normalizedTargetId,
        date: dateStr,
        timeIn: timeIn ? formatToManilaDateTime(timeIn) : null,
        timeOut: timeOut ? formatToManilaDateTime(timeOut) : null,
        lateMinutes: totalLateMinutes,
        undertimeMinutes: totalUndertimeMinutes,
        overtimeMinutes: totalOvertimeMinutes,
        status: finalStatus,
        updatedAt: sql`CURRENT_TIMESTAMP`
      }).onDuplicateKeyUpdate({
        set: {
          timeIn: timeIn ? formatToManilaDateTime(timeIn) : null,
          timeOut: timeOut ? formatToManilaDateTime(timeOut) : null,
          lateMinutes: totalLateMinutes,
          undertimeMinutes: totalUndertimeMinutes,
          overtimeMinutes: totalOvertimeMinutes,
          status: finalStatus,
          updatedAt: sql`CURRENT_TIMESTAMP`
        }
      });
    } else {
      // NO LOGS EXIST FOR THIS DAY
      let statusForNoLogs = 'Absent';
      if (isOnLeave) {
        statusForNoLogs = leaveType || 'Leave';
      }

      // Only record 'Absent' or 'Leave' if the employee was expected to work.
      if (hasScheduleOrTarget || isOnLeave) {
        const normalizedTargetId = normalizeIdJs(employeeId);
        await db.insert(dailyTimeRecords).values({
          employeeId: normalizedTargetId,
          date: dateStr,
          timeIn: null, timeOut: null,
          lateMinutes: 0, undertimeMinutes: 0, overtimeMinutes: 0,
          status: statusForNoLogs,
          updatedAt: sql`CURRENT_TIMESTAMP`
        }).onDuplicateKeyUpdate({
          set: {
            timeIn: null, timeOut: null,
            lateMinutes: 0, undertimeMinutes: 0, overtimeMinutes: 0,
            status: statusForNoLogs,
            updatedAt: sql`CURRENT_TIMESTAMP`
          }
        });
      } else {
        // No logs, no schedule, not on leave. This is a true rest day.
        // Delete any lingering record to keep the DTR clean.
        await db.delete(dailyTimeRecords).where(and(
          compareIds(dailyTimeRecords.employeeId, employeeId),
          eq(dailyTimeRecords.date, dateStr)
        ));
      }
    }

    // 5. AUTO-UPDATE SUMMARY & CHECK VIOLATIONS
    await updateTardinessSummary(employeeId, dateStr);
    
    if (totalLateMinutes > 0 || totalUndertimeMinutes > 0 || status === 'Absent') {
      await checkPolicyViolations(employeeId, dateParts[0], dateParts[1]);
    }
  } catch (error: Error | unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[ATTENDANCE_FATAL] Processor failed for ${employeeId} on ${dateStr}:`, msg);
  }
};
