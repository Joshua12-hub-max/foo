import { z } from 'zod';

export const createPositionSchema = z.object({
  item_number: z.string().min(1, "Item number is required"),
  position_title: z.string().min(1, "Position title is required"),
  salary_grade: z.union([z.string(), z.number()]).transform(val => Number(val)).refine(val => val >= 1 && val <= 33, "Salary grade must be between 1 and 33"),
  step_increment: z.coerce.number().min(1).optional().default(1),
  department_id: z.coerce.number().min(1, "Department is required"),
  monthly_salary: z.coerce.number().optional().nullable(),
  area_code: z.string().optional().nullable(),
  area_type: z.enum(['R','P','D','M','F','B']).optional().nullable(),
  area_level: z.enum(['K','T','S','A']).optional().nullable(),
  is_vacant: z.boolean().optional().default(true)
});

export const updatePositionSchema = createPositionSchema.partial().extend({
  last_promotion_date: z.string().optional().nullable()
});

export const assignEmployeeSchema = z.object({
  employee_id: z.coerce.number().min(1, "Employee ID is required"),
  start_date: z.string().optional() // ISO Date string YYYY-MM-DD
});

export const vacatePositionSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  end_date: z.string().optional()
});

export const abolishPositionSchema = z.object({
  abolishment_ordinance: z.string().min(1, "Abolishment ordinance is required"),
  abolishment_date: z.string().min(1, "Abolishment date is required"),
  reason: z.string().optional()
});

export const uploadSalarySchema = z.object({
  tranche: z.coerce.number().min(1, "Tranche number is required"),
  salaryData: z.array(z.object({
    salary_grade: z.coerce.number().min(1),
    step: z.coerce.number().min(1),
    monthly_salary: z.coerce.number().min(0)
  })).min(1, "Salary data array cannot be empty")
});
