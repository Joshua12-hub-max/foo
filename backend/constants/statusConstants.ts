/**
 * Backend Attendance Status Constants
 * Mirrors frontend/src/constants/statusConstants.ts for 100% consistency.
 */

export const ATTENDANCE_STATUS = {
    PRESENT: 'Present',
    LATE: 'Late',
    PRESENT_LATE: 'Present (Late)',
    ABSENT: 'Absent',
    ON_LEAVE: 'On Leave',
    NO_LOGS: 'No Logs',
    OFF_DUTY: 'Off Duty',
    UNDERTIME: 'Undertime',
    LATE_UNDERTIME: 'Late/Undertime',
    REST_DAY_DUTY: 'Rest Day Duty',
    NEEDS_REVIEW: 'Needs Review',
    PENDING: 'Pending',
    INVALID_NIGHT_IN: 'Invalid - Night Time In',
    INVALID_NIGHT_OUT: 'Invalid - Night Time Out',
} as const;

export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];
