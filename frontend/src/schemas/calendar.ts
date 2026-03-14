import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  date: z.string().min(1, "Date is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  time: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  recurringPattern: z.enum(['none', 'daily', 'weekly', 'monthly']),
  recurringEndDate: z.string().optional().nullable(),
});

export type EventSchema = z.infer<typeof eventSchema>;

export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(['normal', 'high', 'urgent']),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
});

export type AnnouncementSchema = z.infer<typeof announcementSchema>;

export const scheduleSchema = z.object({
  employeeId: z.string().min(1, "Employee must be selected"),
  title: z.string().optional(),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  startTime: z.string().min(1, "Start Time is required"),
  endTime: z.string().min(1, "End Time is required"),
  repeat: z.string().optional(),
  description: z.string().optional()
});

export type ScheduleSchema = z.infer<typeof scheduleSchema>;
