import { z } from 'zod';

export const plantillaSchema = z.object({
  item_number: z.string().min(1, 'Item number is required'),
  position_title: z.string().min(1, 'Position title is required'),
  salary_grade: z.coerce.number().min(1, 'Salary grade is required').max(33, 'Max salary grade is 33'),
  step_increment: z.coerce.number().min(1).max(8).default(1),
  monthly_salary: z.coerce.number().optional(),
  department: z.string().optional(),
  department_id: z.coerce.number().min(1, 'Department is required'),
  is_vacant: z.boolean().default(true),
});

export type PlantillaSchema = z.infer<typeof plantillaSchema>;
