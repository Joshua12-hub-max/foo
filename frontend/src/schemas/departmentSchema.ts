import { z } from 'zod';

// Department Modal Schema
export const DepartmentModalSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string(),
  headOfDepartment: z.string(),
  parentDepartmentId: z.string(),
  location: z.string(),
  budget: z.number().nonnegative(),
});

export type DepartmentModalInput = z.infer<typeof DepartmentModalSchema>;
