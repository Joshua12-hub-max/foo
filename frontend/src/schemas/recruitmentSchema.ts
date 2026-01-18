import { z } from 'zod';

// Schedule Interview Form Schema
export const scheduleInterviewSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  platform: z.enum(['Jitsi Meet', 'Google Meet', 'Zoom', 'Other']),
  link: z.string().url('Please enter a valid meeting URL'),
  notes: z.string().optional()
});

// Generate Meeting Link Response
export const generateMeetingLinkResponseSchema = z.object({
  success: z.boolean(),
  meetingLink: z.string().optional(),
  meetingId: z.string().optional(),
  message: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional()
});

// Save Interview Notes Schema
export const saveInterviewNotesSchema = z.object({
  applicantId: z.number().positive('Applicant ID is required'),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  duration: z.number().optional(), // in minutes
});

// Type exports
export type ScheduleInterviewFormData = z.infer<typeof scheduleInterviewSchema>;
export type GenerateMeetingLinkResponse = z.infer<typeof generateMeetingLinkResponseSchema>;
export type SaveInterviewNotesFormData = z.infer<typeof saveInterviewNotesSchema>;
