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
  resume: z.any().optional(), // File validation handling remains client-side specific for now
});

export type JobApplicationSchema = z.infer<typeof jobApplicationSchema>;

// Public Job Schema for type safety in public views
export interface PublicJob {
    id: number | string;
    title: string;
    department: string;
    location?: string;
    employment_type?: string;
    salary_range?: string;
    posted_at?: string;
    created_at?: string;
    job_description: string;
    requirements: string;
    status: string;
}

