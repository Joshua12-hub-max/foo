import { z } from 'zod';

export const leaveActionSchema = z.object({
  remarks: z.string().optional(),
});

export const rejectionSchema = z.object({
  remarks: z.string().min(1, "Reason for rejection is required"),
});

export const leaveRequestSchema = z.object({
  leave_type: z.string().min(1, "Leave type is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
  attachment: z.any().optional(), // File handling might need specific checks
});

export const submitLeaveRequestSchema = z.object({
  leaveType: z.string().min(1, "Leave type is required"),
  isPaid: z.boolean().default(true),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  description: z.string().min(10, "Reason must be at least 10 characters"),
  attachment: z.any().optional(),
});

export type LeaveActionSchema = z.infer<typeof leaveActionSchema>;
export type RejectionSchema = z.infer<typeof rejectionSchema>;
export type LeaveRequestSchema = z.infer<typeof leaveRequestSchema>;
export type SubmitLeaveRequestSchema = z.infer<typeof submitLeaveRequestSchema>;
