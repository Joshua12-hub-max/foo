import { ATTENDANCE_STATUS } from '../constants/statusConstants.js';

/**
 * Attendance Utilities
 * Centralized logic for late/undertime calculations and status determination.
 */

/**
 * Centralized result interface for late/undertime calculations.
 */
export interface AttendanceCalculation {
  lateMinutes: number;
  undertimeMinutes: number;
  renderMinutes: number; // For future Rendered Time auditing
}

/**
 * Calculates late and undertime minutes based on a schedule block and a grace period.
 */
export const calculateLateUndertime = (
  timeIn: Date | null,
  timeOut: Date | null,
  blockStart: Date,
  blockEnd: Date,
  gracePeriod: number = 0
): AttendanceCalculation => {
  let lateMinutes = 0;
  let undertimeMinutes = 0;
  let renderMinutes = 0;

  // 100% PRECISION: Calculate Late Minutes
  if (timeIn && timeIn > blockStart) {
    const rawLate = Math.floor((timeIn.getTime() - blockStart.getTime()) / 60000);
    if (rawLate > gracePeriod) {
      lateMinutes = rawLate - gracePeriod;
    }
  }

  // 100% PRECISION: Calculate Undertime Minutes
  const now = new Date();
  const isShiftActive = now < blockEnd;

  if (timeOut && timeOut < blockEnd) {
    undertimeMinutes = Math.floor((blockEnd.getTime() - timeOut.getTime()) / 60000);
  } else if (!timeOut) {
    if (!isShiftActive) {
      const effectiveStart = (timeIn && timeIn > blockStart) ? timeIn : blockStart;
      const ut = Math.floor((blockEnd.getTime() - effectiveStart.getTime()) / 60000);
      undertimeMinutes = Math.max(0, ut);
    } else {
      undertimeMinutes = 0;
    }
  }

  if (!timeIn && !timeOut) {
      undertimeMinutes = Math.floor((blockEnd.getTime() - blockStart.getTime()) / 60000);
  }

  if (timeIn && timeOut) {
    renderMinutes = Math.floor((timeOut.getTime() - timeIn.getTime()) / 60000);
  }

  return { lateMinutes, undertimeMinutes, renderMinutes };
};

/**
 * Determines the attendance status string based on late and undertime minutes.
 * Uses centralized ATTENDANCE_STATUS constants for 100% consistency.
 *
 * Business Rules:
 * - Late only → "Present (Late)"
 * - Late + Undertime → "Absent" (new rule)
 * - Undertime only → "Undertime"
 * - Night time (10 PM - 5 AM) → Invalid status
 * - No schedule → "Rest Day Duty"
 * - Reserved statuses (Absent, On Leave, No Logs) → preserved
 */
export const determineStatus = (
  lateMinutes: number,
  undertimeMinutes: number,
  baseStatus: string = ATTENDANCE_STATUS.PRESENT,
  hasSchedule: boolean = true,
  isShiftActive: boolean = false,
  hasTimeOut: boolean = false,
  timeIn?: string | null,
  timeOut?: string | null
): string => {
  // Check for rest day
  if (!hasSchedule) return ATTENDANCE_STATUS.REST_DAY_DUTY;

  // Preserve reserved statuses
  const reserved = [ATTENDANCE_STATUS.ABSENT, ATTENDANCE_STATUS.ON_LEAVE, ATTENDANCE_STATUS.NO_LOGS];
  if (reserved.includes(baseStatus as any)) {
    return baseStatus;
  }

  // Night time validation helper (10 PM - 5 AM)
  const isNightTime = (time: string): boolean => {
    const hour = parseInt(time.split(':')[0]);
    return hour >= 22 || hour < 5;
  };

  // Validate night time in
  if (timeIn && isNightTime(timeIn)) {
    return 'Invalid - Night Time In';
  }

  // Validate night time out
  if (timeOut && isNightTime(timeOut)) {
    return 'Invalid - Night Time Out';
  }

  // Currently on shift (no time out yet)
  if (isShiftActive && !hasTimeOut) {
    if (lateMinutes > 0) return ATTENDANCE_STATUS.PRESENT_LATE;
    return ATTENDANCE_STATUS.PRESENT;
  }

  // 100% BUSINESS RULE: Both late AND undertime = Absent
  // If an employee is late AND leaves early, they are considered absent for the shift.
  if (lateMinutes > 0 && undertimeMinutes > 0) {
    return ATTENDANCE_STATUS.ABSENT;
  }

  // 100% BUSINESS RULE: Late only = Present (Late)
  if (lateMinutes > 0) {
    return ATTENDANCE_STATUS.PRESENT_LATE;
  }

  // 100% BUSINESS RULE: Undertime only = Undertime
  if (undertimeMinutes > 0) {
    return ATTENDANCE_STATUS.UNDERTIME;
  }

  // All good
  return ATTENDANCE_STATUS.PRESENT;
};
