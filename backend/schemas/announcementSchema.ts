import { z } from 'zod';

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(['normal', 'high', 'urgent']).optional().default('normal'),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
});

export const UpdateAnnouncementSchema = CreateAnnouncementSchema.partial();

export type CreateAnnouncementRequest = z.infer<typeof CreateAnnouncementSchema>;
export type UpdateAnnouncementRequest = z.infer<typeof UpdateAnnouncementSchema>;
