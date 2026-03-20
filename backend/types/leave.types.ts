/**
 * CSC-Compliant Leave System Types
 * Based on CSC Omnibus Rules on Leave (Rule XVI)
 */

import type { RowDataPacket } from 'mysql2/promise';

// ============================================================================
// Enums (matching database ENUM types)
// ============================================================================

/**
 * Credit types are now dynamic and managed via internal policies.
 * Common examples: 'Vacation Leave', 'Sick Leave', etc.
 */
export type CreditType = string;

/**
 * Leave types are now dynamic and managed via internal policies.
 */
export type LeaveType = string;

export const TRANSACTION_TYPES = [
  'ACCRUAL',
  'DEDUCTION',
  'ADJUSTMENT',
  'MONETIZATION',
  'FORFEITURE',
  'UNDERTIME_DEDUCTION',
  'TARDINESS_DEDUCTION',
] as const;

export type TransactionType = typeof TRANSACTION_TYPES[number];

export const REFERENCE_TYPES = [
  'leave_application',
  'monetization',
  'dtr',
  'manual',
] as const;

export type ReferenceType = typeof REFERENCE_TYPES[number];

export const APPLICATION_STATUS = [
  'Pending',
  'Processing',
  'Finalizing',
  'Approved',
  'Rejected',
  'Cancelled',
] as const;

export type ApplicationStatus = typeof APPLICATION_STATUS[number];

export const PAYMENT_STATUS = [
  'WITH_PAY',
  'WITHOUT_PAY',
  'PARTIAL',
] as const;

export type PaymentStatus = typeof PAYMENT_STATUS[number];

export const HOLIDAY_TYPES = [
  'Regular',
  'Special Non-Working',
  'Special Working',
] as const;

export type HolidayType = typeof HOLIDAY_TYPES[number];

export const MONETIZATION_PURPOSE = [
  'Health',
  'Medical',
  'Financial Emergency',
] as const;

export type MonetizationPurpose = typeof MONETIZATION_PURPOSE[number];

// ============================================================================
// Database Row Types (for query results)
// ============================================================================

export interface LeaveBalanceRow extends RowDataPacket {
  id: number;
  employeeId: string;
  creditType: CreditType;
  balance: number;
  year: number;
  updatedAt: Date;
}

export interface LeaveLedgerRow extends RowDataPacket {
  id: number;
  employeeId: string;
  creditType: CreditType;
  transactionType: TransactionType;
  amount: number;
  balanceAfter: number;
  referenceId: number | null;
  referenceType: ReferenceType | null;
  remarks: string | null;
  createdBy: string | null;
  createdAt: Date;
}

export interface LeaveApplicationRow extends RowDataPacket {
  id: number;
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  workingDays: number;
  isWithPay: boolean;
  actualPaymentStatus: PaymentStatus;
  daysWithPay: number;
  daysWithoutPay: number;
  crossChargedFrom: string | null;
  reason: string;
  status: ApplicationStatus;
  rejectionReason: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  firstName?: string;
  lastName?: string;
  department?: string;
}

export interface LeaveMonetizationRow extends RowDataPacket {
  id: number;
  employeeId: string;
  creditType: 'Vacation Leave' | 'Sick Leave';
  requestedDays: number;
  dailyRate: number;
  totalAmount: number;
  purpose: MonetizationPurpose;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy: string | null;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HolidayRow extends RowDataPacket {
  id: number;
  name: string;
  date: string;
  type: HolidayType;
  year: number;
  createdAt: Date;
}

export interface LWOPSummaryRow extends RowDataPacket {
  id: number;
  employeeId: string;
  year: number;
  totalLwopDays: number;
  cumulativeLwopDays: number;
  updatedAt: Date;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface ApplyLeaveRequest {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  isWithPay: boolean;
}

export interface LeaveApplicationResponse {
  id: number;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  workingDays: number;
  isWithPay: boolean;
  actualPaymentStatus: PaymentStatus;
  daysWithPay: number;
  daysWithoutPay: number;
  crossChargedFrom: string | null;
  reason: string;
  status: ApplicationStatus;
  rejectionReason: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface LeaveCreditBalance {
  creditType: CreditType;
  balance: number;
  year: number;
}

export interface LeaveCreditsResponse {
  employeeId: string;
  employeeName: string;
  credits: LeaveCreditBalance[];
}

export interface LedgerEntry {
  id: number;
  creditType: CreditType;
  transactionType: TransactionType;
  amount: number;
  balanceAfter: number;
  referenceId: number | null;
  referenceType: ReferenceType | null;
  remarks: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface LedgerResponse {
  employeeId: string;
  entries: LedgerEntry[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export interface WorkingDaysCalculation {
  totalDays: number;
  workingDays: number;
  weekendDays: number;
  holidayDays: number;
}

export interface CreditDeductionResult {
  success: boolean;
  deductedFrom: CreditType;
  amount: number;
  crossCharged: boolean;
  crossChargedFrom?: CreditType;
  remainingBalance: number;
  insufficientCredits?: boolean;
  lwopDays?: number;
}

export interface LWOPDeductionResult {
  dailyRate: number;
  lwopDays: number;
  totalDeduction: number;
}
