import { z } from 'zod';

export const scheduleSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  start_date: z.string().min(1, 'Start Date is required'),
  end_date: z.string().min(1, 'End Date is required'),
  start_time: z.string().min(1, 'Start Time is required'),
  end_time: z.string().min(1, 'End Time is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  is_rest_day: z.boolean().optional()
});

export const updateScheduleSchema = scheduleSchema.partial();
