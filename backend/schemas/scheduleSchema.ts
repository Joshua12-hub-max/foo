import { z } from 'zod';


export const departmentScheduleSchema = z.object({
  departmentId: z.number().int().positive('Department ID must be a positive integer'),
  startDate: z.string().min(1, 'Start Date is required'),
  endDate: z.string().min(1, 'End Date is required'),
  startTime: z.string().min(1, 'Start Time is required'),
  endTime: z.string().min(1, 'End Time is required'),
  scheduleTitle: z.string().optional(),
  repeat: z.string().optional()
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End Date must be greater than or equal to Start Date",
  path: ["endDate"]
});

export const shiftTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  startTime: z.string().min(1, 'Start Time is required'),
  endTime: z.string().min(1, 'End Time is required'),
  description: z.string().optional(),
  departmentId: z.union([z.number().int().positive(), z.literal('all')]).optional(),
  isDefault: z.boolean().optional().default(false),
  workingDays: z.string().optional()
});
