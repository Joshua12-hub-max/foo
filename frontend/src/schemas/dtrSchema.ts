import { z } from 'zod';

// Pagination & Filter Schema
export const DTRFilterSchema = z.object({
  employeeId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  department: z.string().optional(),
  search: z.string().optional(),
});

export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).default(50),
});

export const DTRQuerySchema = DTRFilterSchema.merge(PaginationSchema);

// Update DTR Schema (for Modal)
export const UpdateDTRSchema = z.object({
    timeIn: z.string().nullable().optional(),
    timeOut: z.string().nullable().optional(),
    status: z.string().min(1, 'Status is required'),
    lateMinutes: z.preprocess((val) => {
        if (typeof val === 'string' && val === '') return 0;
        if (typeof val === 'string') return parseInt(val, 10);
        return val;
    }, z.number().nonnegative().default(0)),
    undertimeMinutes: z.preprocess((val) => {
        if (typeof val === 'string' && val === '') return 0;
        if (typeof val === 'string') return parseInt(val, 10);
        return val;
    }, z.number().nonnegative().default(0)),
});

export type DTRFilterValues = z.infer<typeof DTRFilterSchema>;
export type DTRQueryValues = z.infer<typeof DTRQuerySchema>;
export type UpdateDTRValues = z.infer<typeof UpdateDTRSchema>;
