import { z } from 'zod';

// Schedule Interview Data Schema
export const scheduleInterviewSchema = z.object({
  date: z.string().min(1, 'Date is required').refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date >= new Date(new Date().setHours(0, 0, 0, 0));
  }, 'Date must be today or in the future'),
  time: z.string().min(1, 'Time is required').regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  platform: z.enum(['Google Meet', 'Zoom', 'Other'], {
    error: () => ({ message: 'Please select a valid platform' })
  }),
  link: z.string().url('Please enter a valid meeting URL').min(1, 'Meeting link is required'),
  notes: z.string().optional()
});

// Generate Meeting Link Request Schema
export const generateMeetingLinkSchema = z.object({
  applicantId: z.number().positive('Applicant ID is required'),
  date: z.string().min(1, 'Date is required').refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format'),
  duration: z.number().min(15).max(480).optional().default(60)
});

// Generate Meeting Link Response Schema
export const generateMeetingLinkResponseSchema = z.object({
  success: z.boolean(),
  meetingLink: z.string().url().optional(),
  meetingId: z.string().optional(),
  message: z.string().optional()
});

// Update Applicant Stage Schema
export const updateApplicantStageSchema = z.object({
  stage: z.enum(['Applied', 'Screening', 'Initial Interview', 'Final Interview', 'Offer', 'Hired', 'Rejected']),
  interview_date: z.string().optional(),
  interview_link: z.string().url().optional().or(z.literal('')),
  interview_platform: z.enum(['Jitsi Meet', 'Google Meet', 'Zoom', 'Other']).optional(),
  notes: z.string().optional()
});

// Save Interview Notes Schema
export const saveInterviewNotesSchema = z.object({
  applicantId: z.number().positive('Applicant ID is required'),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  duration: z.number().optional(), // in minutes
});

// Type exports
export type ScheduleInterviewData = z.infer<typeof scheduleInterviewSchema>;
export type GenerateMeetingLinkRequest = z.infer<typeof generateMeetingLinkSchema>;
export type GenerateMeetingLinkResponse = z.infer<typeof generateMeetingLinkResponseSchema>;
export type UpdateApplicantStageData = z.infer<typeof updateApplicantStageSchema>;
export type SaveInterviewNotesData = z.infer<typeof saveInterviewNotesSchema>;
