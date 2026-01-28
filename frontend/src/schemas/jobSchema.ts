import { z } from 'zod';

export const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  employment_type: z.enum(['Full-time', 'Part-time', 'Contractual', 'Job Order'] as const),
  status: z.enum(['Open', 'Closed', 'On Hold'] as const),
  salary_range: z.string().optional(),
  application_email: z.string().min(1, 'Email is required').email('Invalid email address'),
  job_description: z.string().min(10, 'Description must be at least 10 characters'),
  requirements: z.string().optional()
});

export type JobSchema = z.infer<typeof jobSchema>;
