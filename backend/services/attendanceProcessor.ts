import { db } from '../db/index.js';
import { attendanceLogs, schedules, dailyTimeRecords, internalPolicies, authentication, leaveApplications } from '../db/schema.js';
import { eq, and, asc, sql } from 'drizzle-orm';
import { updateTardinessSummary } from '../utils/tardinessUtils.js';
import { formatToManilaDateTime } from '../utils/dateUtils.js';
import { checkPolicyViolations } from './violationService.js';

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
 * Handles split shifts (multiple blocks) and defaults to 8 AM - 5 PM.
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

    // 2. Get Employee Duty Info
    const employees = await db.select({
      dutyType: authentication.dutyType,
      dailyTargetHours: authentication.dailyTargetHours
    })
    .from(authentication)
    .where(eq(authentication.employeeId, employeeId))

    .limit(1);

    // 2b. Check for Approved Leave
    const approvedLeaves = await db.select({
      leaveType: leaveApplications.leaveType
    })
    .from(leaveApplications)
    .where(and(
      eq(leaveApplications.employeeId, employeeId),
      eq(leaveApplications.status, 'Approved'),
      sql`DATE(${leaveApplications.startDate}) <= ${dateStr}`,
      sql`DATE(${leaveApplications.endDate}) >= ${dateStr}`
    ))
    .limit(1);
    
    const isOnLeave = approvedLeaves.length > 0;
    const leaveType = isOnLeave ? approvedLeaves[0].leaveType : null;

    const dutyType = employees[0]?.dutyType || 'Standard';




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
      eq(schedules.employeeId, employeeId),
      eq(schedules.dayOfWeek, dayName)
    ))
    .orderBy(asc(schedules.startTime));

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
         // Irregular: Default behavior needs to be careful. 
         // For now, if no schedule is found for Irregular, we don't assume 8-5.
         // But we might want a "Daily Target" fallback if they logged time.
         // console.log(`[ATTENDANCE] No schedule found for Irregular employee ${employeeId} on ${dateStr}`);
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
        const content = typeof policyRow.content === 'string' ? JSON.parse(policyRow.content) : policyRow.content;
        gracePeriod = Number(content.gracePeriod) || 0;
      }
    } catch (e) {
      console.warn('[ATTENDANCE] Error fetching tardiness policy (defaulting to 0):', e);
    }
    
    let totalLateMinutes = 0;
    let totalUndertimeMinutes = 0;
    let timeIn: Date | null = null;
    let timeOut: Date | null = null;

    if (activeBlocks.length > 0) {
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
        // Threshold: Look for logs within 4 hours of the block start/end
        const thresholdMs = 4 * 60 * 60 * 1000;

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
            // Apply Grace Period Rule
            if (minutesLate > gracePeriod) {
              totalLateMinutes += minutesLate;
            } else {
              // console.log(`[ATTENDANCE] ${employeeId} is late by ${minutesLate} mins (Within ${gracePeriod} mins grace). Recording as 0.`);
            }
          }
        }

        if (blockOutLogs.length > 0) {
          const lastOut = new Date(blockOutLogs[blockOutLogs.length - 1].scanTime);
          if (!timeOut || lastOut > timeOut) timeOut = lastOut;

          if (lastOut < blockEnd) {
            totalUndertimeMinutes += Math.floor((blockEnd.getTime() - lastOut.getTime()) / 60000);
          }
        }
      }
    } else {
      // Rest Day or no active blocks: Just record first in and last out
      const inLogs = logs.filter(l => l.type === 'IN');
      const outLogs = logs.filter(l => l.type === 'OUT');
      if (inLogs.length > 0) timeIn = new Date(inLogs[0].scanTime);
      if (outLogs.length > 0) timeOut = new Date(outLogs[outLogs.length - 1].scanTime);
    }

    let status: string = 'Present';
    if (activeBlocks.length > 0) {
      if (!timeIn) {
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

    // 4. Upsert into daily_time_records
    await db.insert(dailyTimeRecords).values({
      employeeId,
      date: dateStr,
      timeIn: timeIn ? formatToManilaDateTime(timeIn) : null,
      timeOut: timeOut ? formatToManilaDateTime(timeOut) : null,
      lateMinutes: totalLateMinutes,
      undertimeMinutes: totalUndertimeMinutes,
      status,
      updatedAt: sql`CURRENT_TIMESTAMP`
    }).onDuplicateKeyUpdate({
      set: {
        timeIn: timeIn ? formatToManilaDateTime(timeIn) : null,
        timeOut: timeOut ? formatToManilaDateTime(timeOut) : null,
        lateMinutes: totalLateMinutes,
        undertimeMinutes: totalUndertimeMinutes,
        status,
        updatedAt: sql`CURRENT_TIMESTAMP`
      }
    });

    // 5. AUTO-UPDATE SUMMARY & CHECK VIOLATIONS
    // This makes the system "Real-Time"
    await updateTardinessSummary(employeeId, dateStr);
    
    // Only check for violations if there's a negative incident to save resources
    if (totalLateMinutes > 0 || totalUndertimeMinutes > 0 || status === 'Absent') {
      const dateParts = dateStr.split('-').map(Number);
      await checkPolicyViolations(employeeId, dateParts[0], dateParts[1]);
    }

    // console.log(`Processed DTR for ${employeeId} on ${dateStr}: Late=${totalLateMinutes}, Undertime=${totalUndertimeMinutes}`);
  } catch (error) {
    console.error('Error processing daily attendance:', error);
    throw error;
  }
};
