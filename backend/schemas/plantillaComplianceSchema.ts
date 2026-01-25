import { z } from 'zod';

// ==================== QUALIFICATION STANDARDS ====================

export const QualificationStandardSchema = z.object({
  position_title: z.string().min(1, 'Position title is required'),
  salary_grade: z.number().int().min(1).max(33, 'Salary grade must be between 1 and 33'),
  education_requirement: z.string().min(1, 'Education requirement is required'),
  experience_years: z.number().int().min(0).default(0),
  training_hours: z.number().int().min(0).default(0),
  eligibility_required: z.string().min(1, 'Eligibility requirement is required'),
  competency_requirements: z.string().optional().nullable(),
  is_active: z.boolean().default(true)
});

export const UpdateQualificationStandardSchema = QualificationStandardSchema.partial();

export const ValidateQualificationSchema = z.object({
  employee_id: z.number().int().positive('Employee ID is required'),
  position_id: z.number().int().positive('Position ID is required')
});

// ==================== NEPOTISM ====================

export const NepotismRelationshipSchema = z.object({
  employee_id_1: z.number().int().positive('First employee ID is required'),
  employee_id_2: z.number().int().positive('Second employee ID is required'),
  relationship_type: z.enum([
    'Parent', 'Child', 'Sibling', 'Spouse',
    'Uncle/Aunt', 'Nephew/Niece', 'Cousin',
    'Grandparent', 'Grandchild', 'In-Law'
  ]),
  degree: z.number().int().min(1).max(4, 'Degree must be between 1 and 4'),
  notes: z.string().optional().nullable()
});

export const CheckNepotismSchema = z.object({
  employee_id: z.number().int().positive('Employee ID is required'),
  position_id: z.number().int().positive('Position ID is required'),
  appointing_authority_id: z.number().int().positive('Appointing authority ID is required').optional()
});

// ==================== STEP INCREMENT ====================

export const StepIncrementTrackerSchema = z.object({
  employee_id: z.number().int().positive('Employee ID is required'),
  position_id: z.number().int().positive('Position ID is required'),
  current_step: z.number().int().min(1).max(8),
  previous_step: z.number().int().min(1).max(8).optional().nullable(),
  eligible_date: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format'),
  status: z.enum(['Pending', 'Approved', 'Denied', 'Processed']).default('Pending'),
  remarks: z.string().optional().nullable()
});

export const ProcessStepIncrementSchema = z.object({
  increment_id: z.number().int().positive('Increment ID is required'),
  status: z.enum(['Approved', 'Denied']),
  remarks: z.string().optional().nullable()
});

// ==================== BUDGET ALLOCATION ====================

export const BudgetAllocationSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  department: z.string().min(1, 'Department is required'),
  total_budget: z.number().positive('Total budget must be positive'),
  notes: z.string().optional().nullable()
});

export const UpdateBudgetAllocationSchema = z.object({
  total_budget: z.number().positive('Total budget must be positive').optional(),
  notes: z.string().optional().nullable()
});

// ==================== POSITION PUBLICATIONS ====================

export const PositionPublicationSchema = z.object({
  position_id: z.number().int().positive('Position ID is required'),
  publication_date: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid publication date'),
  closing_date: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid closing date'),
  publication_medium: z.string().default('CSC Bulletin, LGU Website'),
  status: z.enum(['Draft', 'Published', 'Closed', 'Filled']).default('Draft'),
  notes: z.string().optional().nullable()
});

export const UpdatePositionPublicationSchema = PositionPublicationSchema.partial();

// ==================== ENHANCED PLANTILLA POSITION ====================

export const EnhancedPlantillaPositionSchema = z.object({
  item_number: z.string().min(1, 'Item number is required'),
  position_title: z.string().min(1, 'Position title is required'),
  salary_grade: z.number().int().min(1).max(33),
  step_increment: z.number().int().min(1).max(8).default(1),
  department: z.string().optional().nullable(),
  monthly_salary: z.number().optional().nullable(),
  
  // Compliance fields
  ordinance_number: z.string().optional().nullable(),
  ordinance_date: z.string().optional().nullable().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid ordinance date'),
  qualification_standards_id: z.number().int().positive().optional().nullable(),
  budget_source: z.string().default('Regular'),
  is_coterminous: z.boolean().default(false),
  status: z.enum(['Active', 'Abolished', 'Frozen']).default('Active')
});

export const AbolishPositionSchema = z.object({
  abolishment_ordinance: z.string().min(1, 'Abolishment ordinance is required'),
  abolishment_date: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid abolishment date'),
  reason: z.string().optional().nullable()
});

// ==================== ENHANCED EMPLOYEE (AUTHENTICATION) ====================

export const EmployeeEligibilitySchema = z.object({
  eligibility_type: z.string().optional().nullable(),
  eligibility_number: z.string().optional().nullable(),
  eligibility_date: z.string().optional().nullable().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid eligibility date'),
  highest_education: z.string().optional().nullable(),
  years_of_experience: z.number().int().min(0).default(0)
});

// ==================== COMPLIANCE REPORTS ====================

export const GenerateCSCForm9Schema = z.object({
  position_ids: z.array(z.number().int().positive()).min(1, 'At least one position is required')
});

export const GenerateCSForm33Schema = z.object({
  employee_id: z.number().int().positive('Employee ID is required'),
  position_id: z.number().int().positive('Position ID is required'),
  appointment_type: z.enum(['Original', 'Promotion', 'Transfer', 'Reemployment', 'Reinstatement']),
  appointment_date: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid appointment date')
});

export const GenerateRAISchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100)
});

export const GeneratePSIPopSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  department: z.string().optional().nullable(),
  format: z.enum(['json', 'csv', 'excel', 'pdf']).default('json')
});

// ==================== TYPE EXPORTS ====================

export type QualificationStandardInput = z.infer<typeof QualificationStandardSchema>;
export type UpdateQualificationStandardInput = z.infer<typeof UpdateQualificationStandardSchema>;
export type ValidateQualificationInput = z.infer<typeof ValidateQualificationSchema>;

export type NepotismRelationshipInput = z.infer<typeof NepotismRelationshipSchema>;
export type CheckNepotismInput = z.infer<typeof CheckNepotismSchema>;

export type StepIncrementTrackerInput = z.infer<typeof StepIncrementTrackerSchema>;
export type ProcessStepIncrementInput = z.infer<typeof ProcessStepIncrementSchema>;

export type BudgetAllocationInput = z.infer<typeof BudgetAllocationSchema>;
export type UpdateBudgetAllocationInput = z.infer<typeof UpdateBudgetAllocationSchema>;

export type PositionPublicationInput = z.infer<typeof PositionPublicationSchema>;
export type UpdatePositionPublicationInput = z.infer<typeof UpdatePositionPublicationSchema>;

export type EnhancedPlantillaPositionInput = z.infer<typeof EnhancedPlantillaPositionSchema>;
export type AbolishPositionInput = z.infer<typeof AbolishPositionSchema>;

export type EmployeeEligibilityInput = z.infer<typeof EmployeeEligibilitySchema>;

export type GenerateCSCForm9Input = z.infer<typeof GenerateCSCForm9Schema>;
export type GenerateCSForm33Input = z.infer<typeof GenerateCSForm33Schema>;
export type GenerateRAIInput = z.infer<typeof GenerateRAISchema>;
export type GeneratePSIPopInput = z.infer<typeof GeneratePSIPopSchema>;
