import { z } from 'zod';

export const ClockInSchema = z.object({});

export const ClockOutSchema = z.object({});

export const GetLogsSchema = z.object({
  query: z.object({
    employeeId: z.string().optional(),
    id: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).default(50),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const GetTodayStatusSchema = z.object({
    query: z.object({
        employeeId: z.string().optional(),
    }),
});

export type ClockInInput = z.infer<typeof ClockInSchema>;
export type ClockOutInput = z.infer<typeof ClockOutSchema>;
export type GetLogsInput = z.infer<typeof GetLogsSchema>;
export type GetTodayStatusInput = z.infer<typeof GetTodayStatusSchema>;
