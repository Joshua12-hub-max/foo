import { z } from 'zod';

// ==================== QUALIFICATION STANDARDS ====================

export const qualificationStandardSchema = z.object({
  positionTitle: z.string().min(1, 'Position title is required'),
  salaryGrade: z.number().int().min(1).max(33, 'Salary grade must be between 1 and 33'),
  educationRequirement: z.string().min(1, 'Education requirement is required'),
  experienceYears: z.number().int().min(0).default(0),
  trainingHours: z.number().int().min(0).default(0),
  eligibilityRequired: z.string().min(1, 'Eligibility requirement is required'),
  competencyRequirements: z.string().optional(),
  isActive: z.boolean().default(true)
});

export type QualificationStandardFormData = z.infer<typeof qualificationStandardSchema>;

// ==================== NEPOTISM ====================

export const nepotismRelationshipSchema = z.object({
  employeeId1: z.number().int().positive('First employee is required'),
  employeeId2: z.number().int().positive('Second employee is required'),
  relationshipType: z.enum([
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
  employeeId: z.number().int().positive('Employee is required'),
  positionId: z.number().int().positive('Position is required'),
  currentStep: z.number().int().min(1).max(8),
  eligibleDate: z.string().min(1, 'Eligible date is required'),
  status: z.enum(['Pending', 'Approved', 'Denied', 'Processed']).default('Pending'),
  remarks: z.string().optional()
});

export const processStepIncrementSchema = z.object({
  incrementId: z.number().int().positive('Increment ID is required'),
  status: z.enum(['Approved', 'Denied']),
  remarks: z.string().optional()
});

export type StepIncrementFormData = z.infer<typeof stepIncrementSchema>;
export type ProcessStepIncrementFormData = z.infer<typeof processStepIncrementSchema>;

// ==================== BUDGET ALLOCATION ====================

export const budgetAllocationSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  department: z.string().min(1, 'Department is required'),
  totalBudget: z.number().positive('Total budget must be positive'),
  notes: z.string().optional()
});

export const updateBudgetAllocationSchema = z.object({
  totalBudget: z.number().positive('Total budget must be positive').optional(),
  notes: z.string().optional()
});

export type BudgetAllocationFormData = z.infer<typeof budgetAllocationSchema>;
export type UpdateBudgetAllocationFormData = z.infer<typeof updateBudgetAllocationSchema>;

// ==================== CS FORM 9 (REQUEST FOR PUBLICATION) ====================

export const form9VacantPositionSchema = z.object({
  no: z.number().int().positive(),
  positionTitle: z.string().min(1, 'Position title is required'),
  plantillaItemNo: z.string().min(1, 'Plantilla item number is required'),
  salaryGrade: z.string().min(1, 'Salary grade is required'),
  monthlySalary: z.string().min(1, 'Monthly salary is required'),
  education: z.string().default(''),
  training: z.string().default('None required'),
  experience: z.string().default('None required'),
  eligibility: z.string().default('Career Service (Subprofessional) First Level Eligibility'),
  competency: z.string().default(''),
  placeOfAssignment: z.string().min(1, 'Place of assignment is required')
});

export const form9HeaderSchema = z.object({
  agencyName: z.string().min(1, 'Agency name is required'),
  signatoryName: z.string().min(1, 'Signatory name is required'),
  signatoryTitle: z.string().min(1, 'Signatory title is required'),
  date: z.string().default(''),
  deadlineDate: z.string().default(''),
  officeAddress: z.string().min(1, 'Office address is required'),
  contactInfo: z.string().default('')
});

export const form9Schema = z.object({
  header: form9HeaderSchema,
  positions: z.array(form9VacantPositionSchema).min(1, 'At least one vacant position is required')
});

export type Form9VacantPosition = z.infer<typeof form9VacantPositionSchema>;
export type Form9Header = z.infer<typeof form9HeaderSchema>;
export type Form9Data = z.infer<typeof form9Schema>;
