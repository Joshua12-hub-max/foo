import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().optional(), // Can be inferred from startDate
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  time: z.preprocess((val) => {
    if (typeof val === 'string') return parseInt(val, 10);
    return val;
  }, z.number().optional()),
  description: z.string().optional(),
  recurringPattern: z.string().optional(),
  recurringEndDate: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
});

export type EventSchema = z.infer<typeof eventSchema>;
