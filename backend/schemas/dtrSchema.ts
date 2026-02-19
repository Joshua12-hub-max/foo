import { z } from 'zod';

export const GetDTRSchema = z.object({
  query: z.object({
    employeeId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).default(100),
  }),
});

export const UpdateDTRSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
  body: z.object({
    time_in: z.string().max(100).nullable().optional(),
    time_out: z.string().max(100).nullable().optional(),
    status: z.string().min(1, 'Status is required'),
    late_minutes: z.preprocess((val) => {
        if (typeof val === 'string' && val === '') return 0;
        if (typeof val === 'string') return parseInt(val, 10);
        return val;
    }, z.number().nonnegative().default(0)),
    undertime_minutes: z.preprocess((val) => {
        if (typeof val === 'string' && val === '') return 0;
        if (typeof val === 'string') return parseInt(val, 10);
        return val;
    }, z.number().nonnegative().default(0)),
  }),
});

export const RequestCorrectionSchema = z.object({
  body: z.object({
    date: z.string().min(1, 'Date is required'),
    originalTimeIn: z.preprocess((val) => val === '' ? null : val, z.string().nullable().optional()),
    originalTimeOut: z.preprocess((val) => val === '' ? null : val, z.string().nullable().optional()),
    correctedTimeIn: z.preprocess((val) => val === '' ? null : val, z.string().nullable().optional()),
    correctedTimeOut: z.preprocess((val) => val === '' ? null : val, z.string().nullable().optional()),
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
  }),
});

// ... existing exports
export const UpdateCorrectionStatusSchema = z.object({
  body: z.object({
    ids: z.array(z.number()),
    status: z.enum(['Approved', 'Rejected']),
    rejectionReason: z.string().optional(),
  }),
});

export type GetDTRInput = z.infer<typeof GetDTRSchema>;
export type UpdateDTRInput = z.infer<typeof UpdateDTRSchema>;
export type RequestCorrectionInput = z.infer<typeof RequestCorrectionSchema>;
export type UpdateCorrectionStatusInput = z.infer<typeof UpdateCorrectionStatusSchema>;
