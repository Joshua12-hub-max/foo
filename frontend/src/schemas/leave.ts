import { z } from 'zod';

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

const APPLICATION_STATUS_VALUES = [
  'Pending',
  'Processing',
  'Finalizing',
  'Approved',
  'Rejected',
  'Cancelled',
] as const;

// ============================================================================
// Leave Application Schemas
// ============================================================================

export const applyLeaveSchema = z.object({
  leaveType: z.enum(LEAVE_TYPE_VALUES),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason cannot exceed 1000 characters'),
  isWithPay: z.boolean().default(true),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;

export const rejectLeaveSchema = z.object({
  reason: z.string()
    .min(1, 'Rejection reason is required')
    .max(500, 'Rejection reason cannot exceed 500 characters'),
});

export type RejectLeaveInput = z.infer<typeof rejectLeaveSchema>;

// ============================================================================
// Credit Management Schemas
// ============================================================================

export const creditUpdateSchema = z.object({
  creditType: z.enum(CREDIT_TYPE_VALUES),
  balance: z.number()
    .nonnegative('Balance cannot be negative')
    .multipleOf(0.001, 'Balance must have at most 3 decimal places'),
  remarks: z.string().max(255).optional(),
});

export type CreditUpdateInput = z.infer<typeof creditUpdateSchema>;

export const accrueCreditsSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  employeeIds: z.array(z.string()).optional(),
});

export type AccrueCreditsInput = z.infer<typeof accrueCreditsSchema>;

// ============================================================================
// Monetization Schemas
// ============================================================================

export const monetizationRequestSchema = z.object({
  creditType: z.enum(['Vacation Leave', 'Sick Leave'] as const),
  requestedDays: z.number()
    .positive('Requested days must be positive')
    .multipleOf(0.001),
  purpose: z.enum(MONETIZATION_PURPOSE_VALUES),
});

export type MonetizationRequestInput = z.infer<typeof monetizationRequestSchema>;

// ============================================================================
// Holiday Schemas
// ============================================================================

export const addHolidaySchema = z.object({
  name: z.string()
    .min(1, 'Holiday name is required')
    .max(100, 'Holiday name cannot exceed 100 characters'),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['Regular', 'Special Non-Working', 'Special Working'] as const),
});

export type AddHolidayInput = z.infer<typeof addHolidaySchema>;

// ============================================================================
// Filter Schemas
// ============================================================================

export const leaveFiltersSchema = z.object({
  status: z.string().optional(),
  leaveType: z.string().optional(),
  department: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type LeaveFiltersInput = z.infer<typeof leaveFiltersSchema>;

// ============================================================================
// Legacy Exports (backward compatibility)
// ============================================================================

/** @deprecated Use rejectLeaveSchema instead */
export const rejectionSchema = rejectLeaveSchema;
export type RejectionSchema = RejectLeaveInput;

/** @deprecated Use process remarks separately */
export const leaveActionSchema = z.object({
  remarks: z.string().optional(),
});
export type LeaveActionSchema = z.infer<typeof leaveActionSchema>;

// Re-export old names
export const leaveRequestSchema = z.object({
  leave_type: z.string().min(1, 'Leave type is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  reason: z.string().optional(),
  attachment: z.any().optional(),
});
export type LeaveRequestSchema = z.infer<typeof leaveRequestSchema>;

export const submitLeaveRequestSchema = z.object({
  leaveType: z.string().min(1, 'Leave type is required'),
  isWithPay: z.boolean().default(true),
  isPaid: z.boolean().default(true), // Legacy alias
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(1000).optional(),
  description: z.string().min(10, 'Reason must be at least 10 characters').max(1000).optional(), // Legacy alias
  attachment: z.any().optional(),
});
export type SubmitLeaveRequestSchema = z.infer<typeof submitLeaveRequestSchema>;
