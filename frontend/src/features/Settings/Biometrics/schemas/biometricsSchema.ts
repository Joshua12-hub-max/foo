
import { z } from 'zod';

export const EnrollmentSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  name: z.string().optional(),
  department: z.string().optional()
});

export type EnrollmentFormData = z.infer<typeof EnrollmentSchema>;
