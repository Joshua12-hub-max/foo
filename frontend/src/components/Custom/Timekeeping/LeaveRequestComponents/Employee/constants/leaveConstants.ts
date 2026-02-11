// Pagination
export const PAGE_SIZE = 10;

// Leave Types (CSC Guidelines)
export const LEAVE_TYPES = [
  'Vacation Leave',
  'Sick Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Solo Parent Leave',
  'Special Leave Benefits for Women',
  'Special Emergency Leave',
  'Rehabilitation Leave',
  'Study Leave',
  'VAWC Leave',
  'Special Privilege Leave',
  'Wellness Leave',           // CSC 2025/2026 Memo - 5 days
  'Forced/Mandatory Leave',

  'Other'
] as const;

export type LeaveType = typeof LEAVE_TYPES[number];

// Leave Status
export const LEAVE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  PROCESSING: 'Processing',
  FINALIZING: 'Finalizing'
} as const;

export type LeaveStatus = typeof LEAVE_STATUS[keyof typeof LEAVE_STATUS];

// Table Headers
export const LEAVE_TABLE_HEADERS = [
  'Status',
  'Department',
  'Request ID',
  'Employee ID',
  'Leave Type',
  'From Date',
  'To Date',
  'Actions'
] as const;

// Status Styles
export const STATUS_STYLES: Record<string, string> = {
  Approved: 'bg-green-100 text-green-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Rejected: 'bg-red-100 text-red-800',
  Cancelled: 'bg-gray-100 text-gray-800',
  Processing: 'bg-blue-100 text-blue-800',
  Finalizing: 'bg-purple-100 text-purple-800'
};

// Auto-dismiss timings (in milliseconds)
export const AUTO_DISMISS_ERROR = 5000;
export const AUTO_DISMISS_SUCCESS = 3000;
