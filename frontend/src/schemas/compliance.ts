import { z } from 'zod';

// ==================== QUALIFICATION STANDARDS ====================

export const qualificationStandardSchema = z.object({
  position_title: z.string().min(1, 'Position title is required'),
  salary_grade: z.number().int().min(1).max(33, 'Salary grade must be between 1 and 33'),
  education_requirement: z.string().min(1, 'Education requirement is required'),
  experience_years: z.number().int().min(0).default(0),
  training_hours: z.number().int().min(0).default(0),
  eligibility_required: z.string().min(1, 'Eligibility requirement is required'),
  competency_requirements: z.string().optional(),
  is_active: z.boolean().default(true)
});

export type QualificationStandardFormData = z.infer<typeof qualificationStandardSchema>;

// ==================== NEPOTISM ====================

export const nepotismRelationshipSchema = z.object({
  employee_id_1: z.number().int().positive('First employee is required'),
  employee_id_2: z.number().int().positive('Second employee is required'),
  relationship_type: z.enum([
    'Parent', 'Child', 'Sibling', 'Spouse',
    'Uncle/Aunt', 'Nephew/Niece', 'Cousin',
    'Grandparent', 'Grandchild', 'In-Law'
  ]),
  degree: z.number().int().min(1).max(4),
  notes: z.string().optional()
});

export type NepotismRelationshipFormData = z.infer<typeof nepotismRelationshipSchema>;

// ==================== STEP INCREMENT ====================

export const stepIncrementSchema = z.object({
  employee_id: z.number().int().positive('Employee is required'),
  position_id: z.number().int().positive('Position is required'),
  current_step: z.number().int().min(1).max(8),
  eligible_date: z.string().min(1, 'Eligible date is required'),
  status: z.enum(['Pending', 'Approved', 'Denied', 'Processed']).default('Pending'),
  remarks: z.string().optional()
});

export const processStepIncrementSchema = z.object({
  increment_id: z.number().int().positive('Increment ID is required'),
  status: z.enum(['Approved', 'Denied']),
  remarks: z.string().optional()
});

export type StepIncrementFormData = z.infer<typeof stepIncrementSchema>;
export type ProcessStepIncrementFormData = z.infer<typeof processStepIncrementSchema>;

// ==================== BUDGET ALLOCATION ====================

export const budgetAllocationSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  department: z.string().min(1, 'Department is required'),
  total_budget: z.number().positive('Total budget must be positive'),
  notes: z.string().optional()
});

export const updateBudgetAllocationSchema = z.object({
  total_budget: z.number().positive('Total budget must be positive').optional(),
  notes: z.string().optional()
});

export type BudgetAllocationFormData = z.infer<typeof budgetAllocationSchema>;
export type UpdateBudgetAllocationFormData = z.infer<typeof updateBudgetAllocationSchema>;
