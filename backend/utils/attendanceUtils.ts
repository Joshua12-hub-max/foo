/**
 * Attendance Utilities
 * Centralized logic for late/undertime calculations and status determination.
 */

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
) => {
  let lateMinutes = 0;
  let undertimeMinutes = 0;

  if (timeIn && timeIn > blockStart) {
    const rawLate = Math.floor((timeIn.getTime() - blockStart.getTime()) / 60000);
    // deductive grace period: if late > 15, late = rawLate - 15
    if (rawLate > gracePeriod) {
      lateMinutes = rawLate - gracePeriod;
    }
  }

  if (timeOut && timeOut < blockEnd) {
    undertimeMinutes = Math.floor((blockEnd.getTime() - timeOut.getTime()) / 60000);
  }

  return { lateMinutes, undertimeMinutes };
};

/**
 * Determines the attendance status string based on late and undertime minutes.
 * Preserves special statuses like 'Absent' or 'Leave' if already determined.
 */
export const determineStatus = (
  lateMinutes: number,
  undertimeMinutes: number,
  baseStatus: string = 'Present'
): string => {
  // If it's already a non-calculable status, keep it
  if (baseStatus === 'Absent' || baseStatus === 'Leave' || baseStatus === 'No Logs') {
    return baseStatus;
  }

  if (lateMinutes > 0 && undertimeMinutes > 0) return 'Late/Undertime';
  if (lateMinutes > 0) return 'Late';
  if (undertimeMinutes > 0) return 'Undertime';
  return 'Present';
};
