import { z } from 'zod';

export const plantillaSchema = z.object({
  item_number: z.string().min(1, 'Item number is required'),
  position_title: z.string().min(1, 'Position title is required'),
  salary_grade: z.number().min(1, 'Salary grade is required').max(33, 'Max salary grade is 33'),
  step_increment: z.number().min(1).max(8),
  monthly_salary: z.number().optional(),
  department: z.string().optional(),
  department_id: z.number().min(1, 'Department is required'),
  is_vacant: z.boolean(),
  area_code: z.string().optional(),
  area_type: z.string().optional(),
  area_level: z.string().optional(),
  last_promotion_date: z.string().optional(),
});

export type PlantillaSchema = z.infer<typeof plantillaSchema>;
