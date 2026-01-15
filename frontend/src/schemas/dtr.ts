import { z } from 'zod';

export const dtrEditSchema = z.object({
  timeIn: z.string().optional(),
  timeOut: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  late: z.number().min(0).optional(),
  undertime: z.number().min(0).optional(),
});

export type DtrEditSchema = z.infer<typeof dtrEditSchema>;
