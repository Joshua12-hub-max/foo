/**
 * System-wide Status Constants
 * 100% Dynamic and Type-Safe approach to eliminate hardcoded strings.
 */

export const LEAVE_STATUS = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    PROCESSING: 'Processing',
    CANCELLED: 'Cancelled',
} as const;

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
    INVALID_NIGHT_IN: 'Invalid - Night Time In',
    INVALID_NIGHT_OUT: 'Invalid - Night Time Out',
} as const;

export const PERFORMANCE_STATUS = {
    DRAFT: 'Draft',
    SELF_RATED: 'Self-Rated',
    SUBMITTED: 'Submitted',
    COMPLETED: 'Completed',
    ACKNOWLEDGED: 'Acknowledged',
    DISAGREED: 'Disagreed',
} as const;

export const RECRUITMENT_STATUS = {
    PENDING: 'Pending',
    APPLIED: 'Applied',
    SHORTLISTED: 'Shortlisted',
    INTERVIEWED: 'Interviewed',
    HIRED: 'Hired',
    REJECTED: 'Rejected',
} as const;

export const RECORD_STATUS = {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    ARCHIVED: 'Archived',
} as const;

export const EMPLOYEE_ROLES = {
    ADMINISTRATOR: 'Administrator',
    HUMAN_RESOURCE: 'Human Resource',
    EMPLOYEE: 'Employee',
} as const;

export const BIOMETRIC_STATUS = {
    CONNECTED: 'CONNECTED',
    DISCONNECTED: 'DISCONNECTED',
} as const;

export type LeaveStatus = typeof LEAVE_STATUS[keyof typeof LEAVE_STATUS];
export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];
export type PerformanceStatus = typeof PERFORMANCE_STATUS[keyof typeof PERFORMANCE_STATUS];
export type RecruitmentStatus = typeof RECRUITMENT_STATUS[keyof typeof RECRUITMENT_STATUS];
export type RecordStatus = typeof RECORD_STATUS[keyof typeof RECORD_STATUS];
export type EmployeeRole = typeof EMPLOYEE_ROLES[keyof typeof EMPLOYEE_ROLES];
export type BiometricStatus = typeof BIOMETRIC_STATUS[keyof typeof BIOMETRIC_STATUS];
