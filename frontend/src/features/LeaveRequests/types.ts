/**
 * Leave Request Types for Features
 * Re-exports from centralized types with additional UI-specific types
 */

import { LeaveType, ApplicationStatus } from '@/types/leave.types';

// Re-export all types from central location
export * from '@/types/leave.types';

export interface LeaveCredit {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  creditType: string;
  balance: number;
  daysUsedWithPay: number;
  daysUsedWithoutPay: number;
  year?: number;
  updatedAt?: string;
}

export interface AdminLeaveRequest {
  id: string | number;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: ApplicationStatus;
  isWithPay: boolean;
  attachmentPath?: string | null;
  adminFormPath?: string | null;
  finalAttachmentPath?: string | null;
  currentBalance?: number;
  workingDays?: number;
  actualPaymentStatus?: string;
  daysWithPay?: number;
  daysWithoutPay?: number;
  crossChargedFrom?: string | null;
}

export interface LeaveFilters {
  department: string;
  employee: string;
  fromDate: string;
  toDate: string;
}

export interface EmployeeLeaveRequest {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: ApplicationStatus;
  isWithPay: boolean | number;
  attachmentPath: string | null;
  adminFormPath?: string | null;
  finalAttachmentPath?: string | null;
  workingDays?: number;
  actualPaymentStatus?: string;
  daysWithPay?: number;
  daysWithoutPay?: number;
}

export interface EmployeeLeaveFilters {
  status: string;
  type: string;
  date: string;
}
