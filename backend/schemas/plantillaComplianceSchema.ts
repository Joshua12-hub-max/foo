import { z } from 'zod';

// ==================== QUALIFICATION STANDARDS ====================

export const QualificationStandardSchema = z.object({
  positionTitle: z.string().min(1, 'Position title is required'),
  salaryGrade: z.number().int().min(1).max(33, 'Salary grade must be between 1 and 33'),
  educationRequirement: z.string().min(1, 'Education requirement is required'),
  experienceYears: z.number().int().min(0).default(0),
  trainingHours: z.number().int().min(0).default(0),
  eligibilityRequired: z.string().min(1, 'Eligibility requirement is required'),
  competencyRequirements: z.string().optional().nullable(),
  isActive: z.boolean().default(true)
});

export const UpdateQualificationStandardSchema = QualificationStandardSchema.partial();

export const ValidateQualificationSchema = z.object({
  employeeId: z.number().int().positive('Employee ID is required'),
  positionId: z.number().int().positive('Position ID is required')
});

// ==================== NEPOTISM ====================

export const NepotismRelationshipSchema = z.object({
  employeeId1: z.number().int().positive('First employee ID is required'),
  employeeId2: z.number().int().positive('Second employee ID is required'),
  relationshipType: z.enum([
    'Parent', 'Child', 'Sibling', 'Spouse',
    'Uncle/Aunt', 'Nephew/Niece', 'Cousin',
    'Grandparent', 'Grandchild', 'In-Law'
  ]),
  degree: z.number().int().min(1).max(4, 'Degree must be between 1 and 4'),
  notes: z.string().optional().nullable()
});

export const CheckNepotismSchema = z.object({
  employeeId: z.number().int().positive('Employee ID is required'),
  positionId: z.number().int().positive('Position ID is required'),
  appointingAuthorityId: z.number().int().positive('Appointing authority ID is required').optional()
});

// ==================== STEP INCREMENT ====================

export const StepIncrementTrackerSchema = z.object({
  employeeId: z.number().int().positive('Employee ID is required'),
  positionId: z.number().int().positive('Position ID is required'),
  currentStep: z.number().int().min(1).max(8),
  previousStep: z.number().int().min(1).max(8).optional().nullable(),
  eligibleDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format'),
  status: z.enum(['Pending', 'Approved', 'Denied', 'Processed']).default('Pending'),
  remarks: z.string().optional().nullable()
});

export const ProcessStepIncrementSchema = z.object({
  incrementId: z.number().int().positive('Increment ID is required'),
  status: z.enum(['Approved', 'Denied']),
  remarks: z.string().optional().nullable()
});

// ==================== BUDGET ALLOCATION ====================

export const BudgetAllocationSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  department: z.string().min(1, 'Department is required'),
  totalBudget: z.number().positive('Total budget must be positive'),
  notes: z.string().optional().nullable()
});

export const UpdateBudgetAllocationSchema = z.object({
  totalBudget: z.number().positive('Total budget must be positive').optional(),
  notes: z.string().optional().nullable()
});

// ==================== POSITION PUBLICATIONS ====================

export const PositionPublicationSchema = z.object({
  positionId: z.number().int().positive('Position ID is required'),
  publicationDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid publication date'),
  closingDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid closing date'),
  publicationMedium: z.string().default('CSC Bulletin, LGU Website'),
  status: z.enum(['Draft', 'Published', 'Closed', 'Filled']).default('Draft'),
  notes: z.string().optional().nullable()
});

export const UpdatePositionPublicationSchema = PositionPublicationSchema.partial();

// ==================== ENHANCED PLANTILLA POSITION ====================

export const EnhancedPlantillaPositionSchema = z.object({
  itemNumber: z.string().min(1, 'Item number is required'),
  positionTitle: z.string().min(1, 'Position title is required'),
  salaryGrade: z.number().int().min(1).max(33),
  stepIncrement: z.number().int().min(1).max(8).default(1),
  department: z.string().optional().nullable(),
  monthlySalary: z.number().optional().nullable(),
  
  // Compliance fields
  ordinanceNumber: z.string().optional().nullable(),
  ordinanceDate: z.string().optional().nullable().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid ordinance date'),
  qualificationStandardsId: z.number().int().positive().optional().nullable(),
  budgetSource: z.string().default('Regular'),
  isCoterminous: z.boolean().default(false),
  status: z.enum(['Active', 'Abolished', 'Frozen']).default('Active')
});

export const AbolishPositionSchema = z.object({
  abolishmentOrdinance: z.string().min(1, 'Abolishment ordinance is required'),
  abolishmentDate: z.string().refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid abolishment date'),
  reason: z.string().optional().nullable()
});

// ==================== ENHANCED EMPLOYEE (AUTHENTICATION) ====================

export const EmployeeEligibilitySchema = z.object({
  eligibilityType: z.string().optional().nullable(),
  eligibilityNumber: z.string().optional().nullable(),
  eligibilityDate: z.string().optional().nullable().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid eligibility date'),
  highestEducation: z.string().optional().nullable(),
  yearsOfExperience: z.number().int().min(0).default(0)
});

// ==================== COMPLIANCE REPORTS ====================

export const GenerateCSCForm9Schema = z.object({
  positionIds: z.array(z.number().int().positive()).min(1, 'At least one position is required')
});

export const GenerateCSForm33Schema = z.object({
  employeeId: z.number().int().positive('Employee ID is required'),
  positionId: z.number().int().positive('Position ID is required'),
  appointmentType: z.enum(['Original', 'Promotion', 'Transfer', 'Reemployment', 'Reinstatement']),
  appointmentDate: z.string().refine((val) => {
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
