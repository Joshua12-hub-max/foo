import { z } from 'zod';

// Department Modal Schema
export const DepartmentModalSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string(),
  head_of_department: z.string(),
  parent_department_id: z.string(),
  location: z.string(),
  budget: z.number().nonnegative(),
});

export type DepartmentModalInput = z.infer<typeof DepartmentModalSchema>;
