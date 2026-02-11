import { z } from 'zod';

export const dtrEditSchema = z.object({
  timeIn: z.string().optional(),
  timeOut: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  late: z.number().min(0).optional(),
  undertime: z.number().min(0).optional(),
});

export type DtrEditSchema = z.infer<typeof dtrEditSchema>;

export const dtrCorrectionSchema = z.object({
    timeIn: z.string().optional(),
    timeOut: z.string().optional(),
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export type DtrCorrectionSchema = z.infer<typeof dtrCorrectionSchema>;
