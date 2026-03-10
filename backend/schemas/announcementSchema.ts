import { z } from 'zod';

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(['normal', 'high', 'urgent']).optional().default('normal'),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
});

export const UpdateAnnouncementSchema = CreateAnnouncementSchema.partial();

export type CreateAnnouncementRequest = z.infer<typeof CreateAnnouncementSchema>;
export type UpdateAnnouncementRequest = z.infer<typeof UpdateAnnouncementSchema>;
