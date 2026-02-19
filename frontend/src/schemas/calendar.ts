import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  date: z.string().min(1, "Date is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  time: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  recurring_pattern: z.enum(['none', 'daily', 'weekly', 'monthly']).optional().nullable().default('none'),
  recurring_end_date: z.string().optional().nullable(),
});

export type EventSchema = z.infer<typeof eventSchema>;

export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(['normal', 'high', 'urgent']).default('normal'),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
});

export type AnnouncementSchema = z.infer<typeof announcementSchema>;

export const scheduleSchema = z.object({
  employee_id: z.string().min(1, "Employee must be selected"),
  title: z.string().optional(),
  start_date: z.string().min(1, "Start Date is required"),
  end_date: z.string().min(1, "End Date is required"),
  start_time: z.string().min(1, "Start Time is required"),
  end_time: z.string().min(1, "End Time is required"),
  repeat: z.string().optional(),
  description: z.string().optional()
});

export type ScheduleSchema = z.infer<typeof scheduleSchema>;
