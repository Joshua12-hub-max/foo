import { z } from 'zod';

export const createPositionSchema = z.object({
  itemNumber: z.string().min(1, "Item number is required"),
  positionTitle: z.string().min(1, "Position title is required"),
  salaryGrade: z.union([z.string(), z.number()]).transform(val => Number(val)).refine(val => val >= 1 && val <= 33, "Salary grade must be between 1 and 33"),
  stepIncrement: z.coerce.number().min(1).optional().default(1),
  departmentId: z.coerce.number().min(1, "Department is required"),
  monthlySalary: z.coerce.number().optional().nullable(),
  areaCode: z.string().optional().nullable(),
  areaType: z.enum(['R','P','D','M','F','B']).optional().nullable(),
  areaLevel: z.enum(['K','T','S','A']).optional().nullable(),
  isVacant: z.boolean().optional().default(true)
});

export const updatePositionSchema = createPositionSchema.partial().extend({
  lastPromotionDate: z.string().optional().nullable()
});

export const assignEmployeeSchema = z.object({
  employeeId: z.coerce.number().min(1, "Employee ID is required"),
  startDate: z.string().optional() // ISO Date string YYYY-MM-DD
});

export const vacatePositionSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  endDate: z.string().optional()
});

export const abolishPositionSchema = z.object({
  abolishmentOrdinance: z.string().min(1, "Abolishment ordinance is required"),
  abolishmentDate: z.string().min(1, "Abolishment date is required"),
  reason: z.string().optional()
});

export const uploadSalarySchema = z.object({
  tranche: z.coerce.number().min(1, "Tranche number is required"),
  salaryData: z.array(z.object({
    salaryGrade: z.coerce.number().min(1),
    step: z.coerce.number().min(1),
    monthlySalary: z.coerce.number().min(0)
  })).min(1, "Salary data array cannot be empty")
});

export const createTrancheSchema = z.object({
  name: z.string().min(1, "Tranche name is required"),
  trancheNumber: z.coerce.number().min(1, "Tranche number is required"),
  circularNumber: z.string().optional().nullable(),
  effectiveDate: z.string().optional().nullable()
});
