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
 * Consistent with the Philippine government rule (15-min grace deduction).
 * 
 * @param timeIn Actual clock-in time (Date)
 * @param timeOut Actual clock-out time (Date)
 * @param blockStart Scheduled start time (Date)
 * @param blockEnd Scheduled end time (Date)
 * @param gracePeriod Grace period in minutes (typically 15)
 * @returns Object containing lateMinutes and undertimeMinutes
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
    // Deductive grace period logic
    if (rawLate > gracePeriod) {
      lateMinutes = rawLate - gracePeriod;
    }
  } else if (!timeIn) {
    // Audit Requirement: If NO time-in, they are technically 100% late for the block (Absence logic usually handles this, but we record the minutes for rating)
    lateMinutes = 0; // Absence is handled by status, late minutes are for partials
  }

  // 100% PRECISION: Calculate Undertime Minutes
  const now = new Date();
  const isShiftActive = now < blockEnd;

  if (timeOut && timeOut < blockEnd) {
    undertimeMinutes = Math.floor((blockEnd.getTime() - timeOut.getTime()) / 60000);
  } else if (!timeOut) {
    // Audit Requirement: If NO time-out, we only record undertime if the shift has already ended.
    // If the shift is still active, undertime is 0 (Pending completion).
    if (!isShiftActive) {
      const effectiveStart = (timeIn && timeIn > blockStart) ? timeIn : blockStart;
      const ut = Math.floor((blockEnd.getTime() - effectiveStart.getTime()) / 60000);
      undertimeMinutes = Math.max(0, ut);
    } else {
      undertimeMinutes = 0;
    }
  }

  // 100% PRECISION: Absence Penalty
  // If BOTH are missing, the undertime equals the full shift duration
  if (!timeIn && !timeOut) {
      undertimeMinutes = Math.floor((blockEnd.getTime() - blockStart.getTime()) / 60000);
  }

  // Calculate Rendered Minutes for potential DTR auditing
  if (timeIn && timeOut) {
    renderMinutes = Math.floor((timeOut.getTime() - timeIn.getTime()) / 60000);
  }

  return { lateMinutes, undertimeMinutes, renderMinutes };
};

/**
 * Determines the attendance status string based on late and undertime minutes.
 * Preserves special statuses like 'Absent' or 'Leave' if already determined.
 * 100% Precision: Handles Rest Day Duty cases where a schedule might be missing.
 */
export const determineStatus = (
  lateMinutes: number,
  undertimeMinutes: number,
  baseStatus: string = 'Present',
  hasSchedule: boolean = true,
  isShiftActive: boolean = false,
  hasTimeOut: boolean = false
): string => {
  // If no logs at all for a scheduled day, it's Absent
  if (!hasSchedule) return 'Rest Day Duty';

  // If it's already a non-calculable status, keep it
  if (baseStatus === 'Absent' || baseStatus === 'Leave' || baseStatus === 'No Logs') {
    return baseStatus;
  }

  // 100% PRECISION: Real-time Status Determination
  // If the shift is still active and they haven't timed out, it's 'Present'.
  if (isShiftActive && !hasTimeOut) {
    if (lateMinutes > 0) return 'Present (Late)';
    return 'Present';
  }

  if (lateMinutes > 0 && undertimeMinutes > 0) return 'Late/Undertime';
  if (lateMinutes > 0) return 'Late';
  if (undertimeMinutes > 0) return 'Undertime';
  return 'Present';
};
