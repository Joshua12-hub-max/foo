import { z } from 'zod';

export const AttendanceFilterSchema = z.object({
  department: z.string().optional(),
  employeeId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).default(50),
});

export const AttendanceQuerySchema = AttendanceFilterSchema.merge(PaginationSchema);

export type AttendanceFilterValues = z.infer<typeof AttendanceFilterSchema>;
export type AttendanceQueryValues = z.input<typeof AttendanceQuerySchema>;
