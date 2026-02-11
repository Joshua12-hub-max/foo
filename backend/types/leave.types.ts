/**
 * CSC-Compliant Leave System Types
 * Based on CSC Omnibus Rules on Leave (Rule XVI)
 */

import type { RowDataPacket } from 'mysql2/promise';

// ============================================================================
// Enums (matching database ENUM types)
// ============================================================================

export const CREDIT_TYPES = [
  'Vacation Leave',
  'Sick Leave',
  'Special Privilege Leave',
  'Forced Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Solo Parent Leave',
  'Study Leave',
] as const;

export type CreditType = typeof CREDIT_TYPES[number];

export const LEAVE_TYPES = [
  'Vacation Leave',
  'Sick Leave',
  'Special Privilege Leave',
  'Forced Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Solo Parent Leave',
  'Study Leave',
  'Special Emergency Leave',
  'Official Business',
  'VAWC Leave',
  'Rehabilitation Leave',
  'Special Leave Benefits for Women',
  'Wellness Leave',
] as const;

export type LeaveType = typeof LEAVE_TYPES[number];

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
  employee_id: string;
  credit_type: CreditType;
  balance: number;
  year: number;
  updated_at: Date;
}

export interface LeaveLedgerRow extends RowDataPacket {
  id: number;
  employee_id: string;
  credit_type: CreditType;
  transaction_type: TransactionType;
  amount: number;
  balance_after: number;
  reference_id: number | null;
  reference_type: ReferenceType | null;
  remarks: string | null;
  created_by: string | null;
  created_at: Date;
}

export interface LeaveApplicationRow extends RowDataPacket {
  id: number;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  working_days: number;
  is_with_pay: boolean;
  actual_payment_status: PaymentStatus;
  days_with_pay: number;
  days_without_pay: number;
  cross_charged_from: string | null;
  reason: string;
  medical_certificate_path: string | null;
  status: ApplicationStatus;
  attachment_path: string | null;
  admin_form_path: string | null;
  final_attachment_path: string | null;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: Date | null;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  first_name?: string;
  last_name?: string;
  department?: string;
}

export interface LeaveMonetizationRow extends RowDataPacket {
  id: number;
  employee_id: string;
  credit_type: 'Vacation Leave' | 'Sick Leave';
  requested_days: number;
  daily_rate: number;
  total_amount: number;
  purpose: MonetizationPurpose;
  status: 'Pending' | 'Approved' | 'Rejected';
  approved_by: string | null;
  remarks: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface HolidayRow extends RowDataPacket {
  id: number;
  name: string;
  date: string;
  type: HolidayType;
  year: number;
  created_at: Date;
}

export interface LWOPSummaryRow extends RowDataPacket {
  id: number;
  employee_id: string;
  year: number;
  total_lwop_days: number;
  cumulative_lwop_days: number;
  updated_at: Date;
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
  attachmentPath: string | null;
  adminFormPath: string | null;
  finalAttachmentPath: string | null;
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
// CSC Business Logic Constants
// ============================================================================

/** Monthly VL accrual: 15 days / 12 months = 1.250 days */
export const MONTHLY_VL_ACCRUAL = 1.250;

/** Monthly SL accrual: 15 days / 12 months = 1.250 days */
export const MONTHLY_SL_ACCRUAL = 1.250;

/** Special Privilege Leave: 3 days per year (non-cumulative) */
export const SPL_ANNUAL = 3.000;

/** Forced Leave: 5 days per year from VL (forfeited if unused) */
export const FORCED_LEAVE_ANNUAL = 5.000;

/** Fixed working days per month for salary calculation */
export const WORKING_DAYS_PER_MONTH = 22;

/** Maximum LWOP days per year per CSC */
export const MAX_LWOP_DAYS_PER_YEAR = 365;

/** Minutes in a working day (8 hours) */
export const MINUTES_PER_WORKING_DAY = 480;

/**
 * Leave types that do NOT deduct from VL/SL credits
 */
export const SPECIAL_LEAVES_NO_DEDUCTION: LeaveType[] = [
  'Special Privilege Leave',
  'Special Emergency Leave',
  'Wellness Leave',
  'Official Business',
  'Study Leave',
  'VAWC Leave',
  'Rehabilitation Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Solo Parent Leave',
  'Special Leave Benefits for Women',
];

/**
 * Cross-charging rules per CSC:
 * - SL can fallback to VL when exhausted
 * - VL cannot use SL
 * - Forced Leave deducted from VL
 */
export const CROSS_CHARGE_MAP: Partial<Record<LeaveType, CreditType | null>> = {
  'Sick Leave': 'Vacation Leave',
  'Vacation Leave': null,
  'Forced Leave': 'Vacation Leave',
};

/**
 * Maps leave types to their credit type for deduction
 */
export const LEAVE_TO_CREDIT_MAP: Partial<Record<LeaveType, CreditType | null>> = {
  'Vacation Leave': 'Vacation Leave',
  'Sick Leave': 'Sick Leave',
  'Special Privilege Leave': 'Special Privilege Leave',
  'Forced Leave': 'Vacation Leave',
  'Maternity Leave': 'Maternity Leave',
  'Paternity Leave': 'Paternity Leave',
  'Solo Parent Leave': 'Solo Parent Leave',
  'Study Leave': 'Study Leave',
  'Special Emergency Leave': null,
  'Wellness Leave': null,
  'Official Business': null,
  'VAWC Leave': null,
  'Rehabilitation Leave': null,
  'Special Leave Benefits for Women': null,
};

/**
 * VL must be filed at least 5 days in advance (in working days)
 */
export const VL_ADVANCE_FILING_DAYS = 0;

/**
 * SL > 5 days requires Medical Certificate
 */
export const SL_MEDICAL_CERT_THRESHOLD = 5;

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
