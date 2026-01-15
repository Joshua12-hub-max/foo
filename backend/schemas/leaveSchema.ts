import { z } from 'zod';

export const applyLeaveSchema = z.object({
  leaveType: z.string().min(1, "Leave type is required"),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid end date format",
  }),
  reason: z.string().min(10, "Reason must be at least 10 characters long"),
  withPay: z.preprocess((val) => {
    if (typeof val === 'string') return val === 'true';
    return Boolean(val);
  }, z.boolean()),
  duration: z.string().optional(), // Server calculates this, but client might send it
});

export const rejectLeaveSchema = z.object({
  reason: z.string().min(1, "Rejection reason is required"),
});

export const creditUpdateSchema = z.object({
  creditType: z.string().min(1, "Credit type is required"),
  balance: z.number().nonnegative("Balance cannot be negative"),
});

export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;
export type RejectLeaveInput = z.infer<typeof rejectLeaveSchema>;
export type CreditUpdateInput = z.infer<typeof creditUpdateSchema>;
