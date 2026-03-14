import { LEAVE_TYPES as CENTRAL_LEAVE_TYPES, CROSS_CHARGE_MAP as CENTRAL_CROSS_CHARGE } from '@/types/leave.types';

// Pagination
export const PAGE_SIZE = 10;

// Leave Types (CSC Guidelines)
export const CROSS_CHARGE_MAP = CENTRAL_CROSS_CHARGE;
export const LEAVE_TYPES = CENTRAL_LEAVE_TYPES;

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
