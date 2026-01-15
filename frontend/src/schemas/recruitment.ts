import { z } from 'zod';

export const jobApplicationSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  education: z.string().min(1, 'Education overview is required'),
  experience: z.string().min(1, 'Experience summary is required'),
  skills: z.string().min(1, 'Skills are required'),
  // File validation is tricky with Zod usually done manually or with custom refinement, 
  // but we can set it to any() or custom check.
  // For RHF, file input is often handled via `watch` or `register` with validation.
  // We'll treat it as optional here since logic handled mostly manually or separate.
  resume: z.any().optional(),
});

export type JobApplicationSchema = z.infer<typeof jobApplicationSchema>;
