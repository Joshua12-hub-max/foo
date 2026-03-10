import { z } from 'zod';

export const scheduleSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  startDate: z.string().min(1, 'Start Date is required'),
  endDate: z.string().min(1, 'End Date is required'),
  startTime: z.string().min(1, 'Start Time is required'),
  endTime: z.string().min(1, 'End Time is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  isRestDay: z.boolean().optional()
});

export const updateScheduleSchema = scheduleSchema.partial();
