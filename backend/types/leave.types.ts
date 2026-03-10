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
  'Adoption Leave',
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
  'VAWC Leave',
  'Rehabilitation Leave',
  'Special Leave Benefits for Women',
  'Wellness Leave',
  'Adoption Leave',
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
  'Study Leave',
  'VAWC Leave',
  'Rehabilitation Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Solo Parent Leave',
  'Special Leave Benefits for Women',
  'Adoption Leave',
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
  'VAWC Leave': null,
  'Rehabilitation Leave': null,
  'Special Leave Benefits for Women': null,
  'Adoption Leave': 'Adoption Leave',
};

/**
 * VL must be filed at least 5 days in advance (in working days)
 */
/**
 * VL must be filed at least 5 days in advance (in working days/calendar days)
 */
export const VL_ADVANCE_FILING_DAYS = 0;

/**
 * Paternity Leave: 7 days per year (RA 8187)
 */
export const PATERNITY_LEAVE_DAYS = 7;

/**
 * VAWC Leave: 10 days per year (RA 9262)
 */
export const VAWC_LEAVE_DAYS = 10;

/**
 * Special Leave Benefits for Women: 2 months (approx 60 days) per year (RA 9710)
 */
export const SPECIAL_LEAVE_WOMEN_DAYS = 60;

/**
 * Maternity Leave: 105 days (RA 11210)
 * Note: This is per instance, but typically checked as max duration per request
 */
export const MATERNITY_LEAVE_DAYS = 105;

/**
 * Adoption Leave: 60 days (RA 8552)
 */
export const ADOPTION_LEAVE_DAYS = 60;

/**
 * Special Emergency Leave: 5 days per year
 */
export const SPECIAL_EMERGENCY_LEAVE_DAYS = 5;

/**
 * Forced Leave: 5 days per year
 */
export const FORCED_LEAVE_DAYS = 5;

// ============================================================================
// CSC Leave Credit Earnings Table (Rule XVI)
// ============================================================================

export const CSC_CREDIT_EARNINGS_TABLE = [
  { daysPresent: 30.00, earned: 1.250 },
  { daysPresent: 29.50, earned: 1.229 },
  { daysPresent: 29.00, earned: 1.208 },
  { daysPresent: 28.50, earned: 1.188 },
  { daysPresent: 28.00, earned: 1.167 },
  { daysPresent: 27.50, earned: 1.146 },
  { daysPresent: 27.00, earned: 1.125 },
  { daysPresent: 26.50, earned: 1.104 },
  { daysPresent: 26.00, earned: 1.083 },
  { daysPresent: 25.50, earned: 1.063 },
  { daysPresent: 25.00, earned: 1.042 },
  { daysPresent: 24.50, earned: 1.021 },
  { daysPresent: 24.00, earned: 1.000 },
  { daysPresent: 23.50, earned: 0.979 },
  { daysPresent: 23.00, earned: 0.958 },
  { daysPresent: 22.50, earned: 0.938 },
  { daysPresent: 22.00, earned: 0.917 },
  { daysPresent: 21.50, earned: 0.896 },
  { daysPresent: 21.00, earned: 0.875 },
  { daysPresent: 20.50, earned: 0.854 },
  { daysPresent: 20.00, earned: 0.833 },
  { daysPresent: 19.50, earned: 0.813 },
  { daysPresent: 19.00, earned: 0.792 },
  { daysPresent: 18.50, earned: 0.771 },
  { daysPresent: 18.00, earned: 0.750 },
  { daysPresent: 17.50, earned: 0.729 },
  { daysPresent: 17.00, earned: 0.708 },
  { daysPresent: 16.50, earned: 0.687 },
  { daysPresent: 16.00, earned: 0.667 },
  { daysPresent: 15.50, earned: 0.646 },
  { daysPresent: 15.00, earned: 0.625 },
  { daysPresent: 14.50, earned: 0.604 },
  { daysPresent: 14.00, earned: 0.583 },
  { daysPresent: 13.50, earned: 0.562 },
  { daysPresent: 13.00, earned: 0.542 },
  { daysPresent: 12.50, earned: 0.521 },
  { daysPresent: 12.00, earned: 0.500 },
  { daysPresent: 11.50, earned: 0.479 },
  { daysPresent: 11.00, earned: 0.458 },
  { daysPresent: 10.50, earned: 0.438 },
  { daysPresent: 10.00, earned: 0.417 },
  { daysPresent: 9.50, earned: 0.396 },
  { daysPresent: 9.00, earned: 0.375 },
  { daysPresent: 8.50, earned: 0.354 },
  { daysPresent: 8.00, earned: 0.333 },
  { daysPresent: 7.50, earned: 0.312 },
  { daysPresent: 7.00, earned: 0.292 },
  { daysPresent: 6.50, earned: 0.271 },
  { daysPresent: 6.00, earned: 0.250 },
  { daysPresent: 5.50, earned: 0.229 },
  { daysPresent: 5.00, earned: 0.208 },
  { daysPresent: 4.50, earned: 0.187 },
  { daysPresent: 4.00, earned: 0.167 },
  { daysPresent: 3.50, earned: 0.146 },
  { daysPresent: 3.00, earned: 0.125 },
  { daysPresent: 2.50, earned: 0.104 },
  { daysPresent: 2.00, earned: 0.083 },
  { daysPresent: 1.50, earned: 0.062 },
  { daysPresent: 1.00, earned: 0.042 },
  { daysPresent: 0.00, earned: 0.000 }
];

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
