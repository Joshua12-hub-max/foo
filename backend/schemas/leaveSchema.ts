import { z } from 'zod';

// Leave and Credit type validations are now handled dynamically against the internal policies.

// ============================================================================
// Leave Application Schemas
// ============================================================================

/**
 * Schema for applying for leave
 * Includes CSC filing rules validation
 */
export const applyLeaveSchema = z.object({
  leaveType: z.string().min(1, 'Leave type is required'),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format',
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format',
  }),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason cannot exceed 1000 characters'),
  isWithPay: z.preprocess((val) => {
    if (typeof val === 'string') return val === 'true';
    if (val === undefined || val === null) return true;
    return Boolean(val);
  }, z.boolean().default(true)),
  isHalfDay: z.preprocess((val) => {
    if (typeof val === 'string') return val === 'true';
    if (val === undefined || val === null) return false;
    return Boolean(val);
  }, z.boolean().default(false)),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

export type ApplyLeaveInput = z.output<typeof applyLeaveSchema>;

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
 * Schema for approving a leave application
 */
export const approveLeaveSchema = z.object({
  remarks: z.string().max(500).optional(),
});

export type ApproveLeaveInput = z.infer<typeof approveLeaveSchema>;

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
  creditType: z.string().min(1, 'Credit type is required'),
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
  creditType: z.string().min(1, 'Credit type is required'),
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
  creditType: z.string().min(1, 'Credit type is required'),
  requestedDays: z.number()
    .positive('Requested days must be positive')
    .multipleOf(0.001, 'Days must have at most 3 decimal places'),
  purpose: z.string().min(1, 'Purpose is required'),
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
  type: z.string().min(1, 'Holiday type is required'),
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
// Internal Policy Schemas (Replacing Type Erasure)
// ============================================================================

export const leavePolicySchema = z.object({
  types: z.array(z.string()),
  annualLimits: z.record(z.string(), z.number()),
  advanceFilingDays: z.object({
    days: z.number(),
    appliesTo: z.array(z.string()),
    description: z.string().optional(),
  }),
  sickLeaveWindow: z.object({
    maxDaysAfterReturn: z.number(),
    description: z.string().optional(),
  }),
  crossChargeMap: z.record(z.string(), z.string()),
  leaveToCreditMap: z.record(z.string(), z.string()),
  specialLeavesNoDeduction: z.array(z.string()),
  requiredAttachments: z.record(
    z.string(),
    z.object({
      condition: z.string(),
      required: z.string(),
    })
  ).optional().default({}),
  forcedLeaveRule: z.object({
    minimumVLRequired: z.number(),
    description: z.string(),
  }).optional().default({
    minimumVLRequired: 5,
    description: "Must take at least 5 days VL if balance is 10 or more",
  }),
  deemedApprovalGracePeriod: z.number().optional().default(5),
  deemedApproval: z.object({
    days: z.number(),
    description: z.string(),
    reference: z.string(),
  }).optional().default({
    days: 5,
    description: "Automatic approval after 5 days of inactivity",
    reference: "CSC Rule",
  }),
  sickLeaveType: z.string().default('Sick Leave'),
  initialAllocations: z.record(z.string(), z.number()).default({
    'Vacation Leave': 15.000,
    'Sick Leave': 15.000,
    'Special Privilege Leave': 3.000
  }),
  workingDaysPerMonth: z.number().default(22),
  monthlyAccrual: z.object({
    accruingTypes: z.array(z.string()),
    accrualRuleType: z.string().default('CSC_STANDARD'),
    accrualCreditTypes: z.array(z.string()).default(['Vacation Leave', 'Sick Leave']),
  }).optional().default({
    accruingTypes: ['Permanent', 'Contractual'],
    accrualRuleType: 'CSC_STANDARD',
    accrualCreditTypes: ['Vacation Leave', 'Sick Leave'],
  }),
});

export type LeavePolicyContentStrict = z.infer<typeof leavePolicySchema>;
