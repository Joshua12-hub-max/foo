/**
 * CSC-Compliant Leave System Types
 * Frontend TypeScript types matching backend
 */

// ============================================================================
// Enums (matching backend ENUM types)
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

export const APPLICATION_STATUS = [
  'Pending',
  'Processing',
  'Finalizing',
  'Approved',
  'Rejected',
  'Cancelled',
] as const;

export type ApplicationStatus = typeof APPLICATION_STATUS[number];

export const PAYMENT_STATUS = ['WITH_PAY', 'WITHOUT_PAY', 'PARTIAL'] as const;

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
// API Response Types
// ============================================================================

export interface LeaveBalance {
  id: number;
  employeeId: string;
  creditType: CreditType;
  balance: number;
  year: number;
  updatedAt: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  daysUsedWithPay?: number;
  daysUsedWithoutPay?: number;
}

export interface LedgerEntry {
  id: number;
  employeeId: string;
  creditType: CreditType;
  transactionType: TransactionType;
  amount: number;
  balanceAfter: number;
  referenceId: number | null;
  referenceType: string | null;
  remarks: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface LeaveApplication {
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
  medicalCertificatePath: string | null;
  status: ApplicationStatus;
  attachmentPath: string | null;
  adminFormPath: string | null;
  finalAttachmentPath: string | null;
  rejectionReason: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  firstName?: string;
  lastName?: string;
  department?: string;
}

export interface Holiday {
  id: number;
  name: string;
  date: string;
  type: HolidayType;
  year: number;
  createdAt: string;
}

export interface LWOPSummary {
  id: number;
  employeeId: string;
  year: number;
  totalLwopDays: number;
  cumulativeLwopDays: number;
  updatedAt: string;
}

export interface MonetizationRequest {
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
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// API Request Types
// ============================================================================

export interface ApplyLeavePayload {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  isWithPay: boolean;
}

export interface RejectLeavePayload {
  reason: string;
}

export interface CreditUpdatePayload {
  creditType: CreditType;
  balance: number;
  remarks?: string;
}

export interface AccrueCreditsPayload {
  month: number;
  year: number;
  employeeIds?: string[];
}

export interface MonetizationPayload {
  creditType: 'Vacation Leave' | 'Sick Leave';
  requestedDays: number;
  purpose: MonetizationPurpose;
}

export interface AddHolidayPayload {
  name: string;
  date: string;
  type: HolidayType;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

export interface LeaveListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ApplicationStatus | '';
  leaveType?: LeaveType | '';
  department?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreditListParams {
  page?: number;
  limit?: number;
  search?: string;
  year?: number;
}

export interface LedgerParams {
  page?: number;
  limit?: number;
  creditType?: CreditType | '';
  year?: number;
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface PaginationInfo {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface LeaveApplicationsResponse {
  applications: LeaveApplication[];
  pagination: PaginationInfo;
}

export interface LeaveCreditsResponse {
  credits: LeaveBalance[];
  year: number;
  pagination?: PaginationInfo;
}

export interface LedgerResponse {
  entries: LedgerEntry[];
  pagination: PaginationInfo;
}

export interface HolidaysResponse {
  holidays: Holiday[];
  year: number;
}

export interface ApplyLeaveResponse {
  message: string;
  id: number;
  workingDays: number;
  actualPaymentStatus: PaymentStatus;
  daysWithPay: number;
  daysWithoutPay: number;
  crossChargedFrom: string | null;
  needsMedCert: boolean;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface LeaveFilters {
  status: ApplicationStatus | '';
  leaveType: LeaveType | '';
  department: string;
  startDate: string;
  endDate: string;
}

export interface SelectedLeave {
  application: LeaveApplication;
  mode: 'view' | 'approve' | 'reject' | 'process';
}

// ============================================================================
// CSC Business Logic Constants (Frontend reference)
// ============================================================================

export const CSC_CONSTANTS = {
  MONTHLY_VL_ACCRUAL: 1.250,
  MONTHLY_SL_ACCRUAL: 1.250,
  SPL_ANNUAL: 3.000,
  FORCED_LEAVE_ANNUAL: 5.000,
  WORKING_DAYS_PER_MONTH: 22,
  VL_ADVANCE_FILING_DAYS: 5,
  SL_MEDICAL_CERT_THRESHOLD: 5,
  MAX_LWOP_DAYS_PER_YEAR: 365,
} as const;

/** Leave types that don't deduct from VL/SL credits */
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

/** Cross-charging rules: SL can use VL, VL cannot use SL */
export const CROSS_CHARGE_MAP: Partial<Record<LeaveType, CreditType | null>> = {
  'Sick Leave': 'Vacation Leave',
  'Vacation Leave': null,
  'Forced Leave': 'Vacation Leave',
};
