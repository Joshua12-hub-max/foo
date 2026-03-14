import { z } from 'zod';

export const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contractual', 'Job Order', 'Coterminous', 'Temporary', 'Probationary', 'Casual', 'Permanent'] as const),
  dutyType: z.enum(['Standard', 'Irregular'] as const),
  status: z.enum(['Open', 'Closed', 'On Hold'] as const),
  applicationEmail: z.string().min(1, 'Email is required').email('Invalid email address'),
  jobDescription: z.string().min(10, 'Description must be at least 10 characters'),
  requirements: z.string().nullish(),


  attachmentPath: z.union([z.string(), z.instanceof(File)]).nullish(),
  requireCivilService: z.boolean(),
  requireGovernmentIds: z.boolean(),
  requireEducationExperience: z.boolean(),
  education: z.string().nullish(),
  experience: z.string().nullish(),
  training: z.string().nullish(),
  eligibility: z.string().nullish(),
  otherQualifications: z.string().nullish(),
});

export type JobSchema = z.infer<typeof jobSchema>;
