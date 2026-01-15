import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  description: z.string().optional(),
  head_of_department: z.string().optional(),
});

export type DepartmentSchema = z.infer<typeof departmentSchema>;
