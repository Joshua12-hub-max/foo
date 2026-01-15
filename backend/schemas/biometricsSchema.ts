import { z } from 'zod';

export const StartEnrollmentSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
});

export const GetEnrollmentStatusSchema = z.object({
  params: z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
  }),
});

export type StartEnrollmentInput = z.infer<typeof StartEnrollmentSchema>;
export type GetEnrollmentStatusInput = z.infer<typeof GetEnrollmentStatusSchema>;
