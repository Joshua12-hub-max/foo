import { z } from 'zod';

export const StartEnrollmentSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
});

export const EnrollmentStatusResponseSchema = z.object({
  success: z.boolean(),
  isEnrolled: z.boolean(),
});

export type StartEnrollmentValues = z.infer<typeof StartEnrollmentSchema>;
export type EnrollmentStatusResponse = z.infer<typeof EnrollmentStatusResponseSchema>;
