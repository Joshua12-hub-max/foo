import { z } from 'zod';

export const plantillaSchema = z.object({
  itemNumber: z.string().min(1, 'Item number is required'),
  positionTitle: z.string().min(1, 'Position title is required'),
  salaryGrade: z.number().min(1, 'Salary grade is required').max(33, 'Max salary grade is 33'),
  stepIncrement: z.number().min(1).max(8),
  monthlySalary: z.number().optional(),
  department: z.string().optional(),
  departmentId: z.number().min(1, 'Department is required'),
  isVacant: z.boolean(),
  areaCode: z.string().optional(),
  areaType: z.string().optional(),
  areaLevel: z.string().optional(),
  lastPromotionDate: z.string().optional(),
});

export type PlantillaSchema = z.infer<typeof plantillaSchema>;
