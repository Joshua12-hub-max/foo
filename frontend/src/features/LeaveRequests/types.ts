/**
 * Leave Request Types for Features
 * Re-exports from centralized types with additional UI-specific types
 */

// Re-export all types from central location
export * from '@/types/leave.types';

// Legacy type aliases for backward compatibility
export interface LeaveCredit {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  department: string;
  credit_type: string;
  balance: number;
  days_used_with_pay: number;
  days_used_without_pay: number;
  // New CSC fields
  year?: number;
  updated_at?: string;
}

export interface AdminLeaveRequest {
  id: string | number;
  employee_id: string;
  name: string;
  department: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  with_pay: boolean;
  attachment_path?: string;
  final_attachment_path?: string;
  first_name: string;
  last_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  current_balance?: number;
  // New CSC fields
  working_days?: number;
  actual_payment_status?: string;
  days_with_pay?: number;
  days_without_pay?: number;
  cross_charged_from?: string | null;
}

export interface LeaveFilters {
  department: string;
  employee: string;
  fromDate: string;
  toDate: string;
}

export interface EmployeeLeaveRequest {
  id: number;
  employee_id: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  with_pay: boolean | number;
  attachment_path: string | null;
  department: string;
  name: string;
  first_name?: string;
  last_name?: string;
  start_date?: string;
  end_date?: string;
  leave_type?: string;
  // New CSC fields
  working_days?: number;
  actual_payment_status?: string;
  days_with_pay?: number;
  days_without_pay?: number;
}

export interface EmployeeLeaveFilters {
  status: string;
  type: string;
  date: string;
}
