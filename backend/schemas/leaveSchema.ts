import { z } from 'zod';
import { 
  VL_ADVANCE_FILING_DAYS,
  SL_MEDICAL_CERT_THRESHOLD 
} from '../types/leave.types.js';

// ============================================================================
// Enum Values (inline for Zod compatibility)
// ============================================================================

const LEAVE_TYPE_VALUES = [
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

const CREDIT_TYPE_VALUES = [
  'Vacation Leave',
  'Sick Leave',
  'Special Privilege Leave',
  'Forced Leave',
  'Maternity Leave',
  'Paternity Leave',
  'Solo Parent Leave',
  'Study Leave',
] as const;

const MONETIZATION_PURPOSE_VALUES = ['Health', 'Medical', 'Financial Emergency'] as const;

// ============================================================================
// Leave Application Schemas
// ============================================================================

/**
 * Schema for applying for leave
 * Includes CSC filing rules validation
 */
export const applyLeaveSchema = z.object({
  leaveType: z.enum(LEAVE_TYPE_VALUES),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format',
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format',
  }),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters long')
    .max(1000, 'Reason cannot exceed 1000 characters'),
  isWithPay: z.preprocess((val) => {
    if (typeof val === 'string') return val === 'true';
    return Boolean(val);
  }, z.boolean()),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;

/**
 * Schema for rejecting a leave application
 */
export const rejectLeaveSchema = z.object({
  reason: z.string()
    .min(1, 'Rejection reason is required')
    .max(500, 'Rejection reason cannot exceed 500 characters'),
});

export type RejectLeaveInput = z.infer<typeof rejectLeaveSchema>;

/**
 * Schema for processing leave (admin uploads form)
 */
export const processLeaveSchema = z.object({
  remarks: z.string().max(500).optional(),
});

export type ProcessLeaveInput = z.infer<typeof processLeaveSchema>;

// ============================================================================
// Credit Management Schemas
// ============================================================================

/**
 * Schema for updating employee credit balance
 */
export const creditUpdateSchema = z.object({
  creditType: z.enum(CREDIT_TYPE_VALUES),
  balance: z.number()
    .nonnegative('Balance cannot be negative')
    .multipleOf(0.001, 'Balance must have at most 3 decimal places'),
  remarks: z.string().max(255).optional(),
});

export type CreditUpdateInput = z.infer<typeof creditUpdateSchema>;

/**
 * Schema for manual credit adjustment
 */
export const creditAdjustmentSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  creditType: z.enum(CREDIT_TYPE_VALUES),
  amount: z.number()
    .multipleOf(0.001, 'Amount must have at most 3 decimal places'),
  remarks: z.string()
    .min(1, 'Remarks are required for adjustments')
    .max(500),
});

export type CreditAdjustmentInput = z.infer<typeof creditAdjustmentSchema>;

/**
 * Schema for monthly accrual (batch operation)
 */
export const accrueCreditsSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  employeeIds: z.array(z.string()).optional(),
});

export type AccrueCreditsInput = z.infer<typeof accrueCreditsSchema>;

// ============================================================================
// Monetization Schemas
// ============================================================================

/**
 * Schema for credit monetization request
 * CSC: Must leave at least 5 days VL after monetization
 */
export const monetizationRequestSchema = z.object({
  creditType: z.enum(['Vacation Leave', 'Sick Leave'] as const),
  requestedDays: z.number()
    .positive('Requested days must be positive')
    .multipleOf(0.001, 'Days must have at most 3 decimal places'),
  purpose: z.enum(MONETIZATION_PURPOSE_VALUES),
});

export type MonetizationRequestInput = z.infer<typeof monetizationRequestSchema>;

/**
 * Schema for approving/rejecting monetization
 */
export const monetizationActionSchema = z.object({
  approved: z.boolean(),
  remarks: z.string().max(500).optional(),
});

export type MonetizationActionInput = z.infer<typeof monetizationActionSchema>;

// ============================================================================
// Holiday Management Schemas
// ============================================================================

/**
 * Schema for adding a holiday
 */
export const addHolidaySchema = z.object({
  name: z.string()
    .min(1, 'Holiday name is required')
    .max(100, 'Holiday name cannot exceed 100 characters'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  type: z.enum(['Regular', 'Special Non-Working', 'Special Working'] as const),
});

export type AddHolidayInput = z.infer<typeof addHolidaySchema>;

// ============================================================================
// Query Parameter Schemas
// ============================================================================

/**
 * Schema for leave applications list query params
 */
export const leaveListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.string().optional(),
  leaveType: z.string().optional(),
  department: z.string().optional(),
  employeeId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type LeaveListQuery = z.infer<typeof leaveListQuerySchema>;

/**
 * Schema for ledger query params
 */
export const ledgerQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  creditType: z.string().optional(),
  year: z.coerce.number().optional(),
});

export type LedgerQuery = z.infer<typeof ledgerQuerySchema>;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate VL advance filing requirement (5 days before)
 */
export const validateVLAdvanceFiling = (startDate: string): boolean => {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = start.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= VL_ADVANCE_FILING_DAYS;
};

/**
 * Check if SL requires medical certificate (more than 5 days)
 */
export const requiresMedicalCertificate = (workingDays: number): boolean => {
  return workingDays > SL_MEDICAL_CERT_THRESHOLD;
};
