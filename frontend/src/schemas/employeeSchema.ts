import { z } from 'zod';

export const CreateEmployeeSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  department: z.string().min(1, "Department is required"),
  department_id: z.coerce.number().optional().nullable(),
  job_title: z.string().optional(),
  role: z.enum(['admin', 'hr', 'employee']),
  employment_status: z.string().default("Active"),
  employment_type: z.enum(['Regular', 'Probationary', 'Job Order', 'Contractual']).default('Probationary'),
  contract_end_date: z.string().optional().nullable(),
  regularization_date: z.string().optional().nullable(),
  is_regular: z.boolean().default(false),
  employee_id: z.string().optional(),
  password: z.string().optional(),
  
  // Personal Info
  birth_date: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  civil_status: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  permanent_address: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  emergency_contact_number: z.string().optional().nullable(),
  educational_background: z.string().optional().nullable(),
  
  // Extended PDS Fields
  place_of_birth: z.string().optional().nullable(),
  blood_type: z.string().optional().nullable(),
  height_m: z.coerce.number().optional().nullable(),
  weight_kg: z.coerce.number().optional().nullable(),
  citizenship_type: z.string().optional().nullable(),
  dual_citizenship_country: z.string().optional().nullable(),
  telephone_no: z.string().optional().nullable(),
  residential_address: z.string().optional().nullable(),
  residential_zip_code: z.string().optional().nullable(),
  permanent_zip_code: z.string().optional().nullable(),
  agency_employee_no: z.string().optional().nullable(),
  
  // Government Identification
  philhealth_number: z.string().optional().nullable(),
  pagibig_number: z.string().optional().nullable(),
  tin_number: z.string().optional().nullable(),
  gsis_number: z.string().optional().nullable(),
  
  // Employment Details
  salary_grade: z.coerce.number().optional().nullable(), // Coerce for form inputs
  step_increment: z.coerce.number().optional().nullable(),
  appointment_type: z.string().optional().nullable(),
  station: z.string().optional().nullable(),
  position_title: z.string().optional().nullable(),
  position_id: z.coerce.number().optional().nullable(),
  item_number: z.string().optional().nullable(),
  date_hired: z.string().optional().nullable(),
  
  // Plantilla-required Eligibility Fields
  eligibility_type: z.string().optional().nullable(),
  eligibility_number: z.string().optional().nullable(),
  eligibility_date: z.string().optional().nullable(),
  highest_education: z.string().optional().nullable(),
  years_of_experience: z.coerce.number().optional().nullable(),
  
  // Social Media
  facebook_url: z.string().optional().nullable(),
  linkedin_url: z.string().optional().nullable(),
  twitter_handle: z.string().optional().nullable(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

export const AddSkillSchema = z.object({
  skill_name: z.string().min(1, "Skill name is required"),
  category: z.string().default("Technical"),
  proficiency_level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).default("Intermediate"),
  years_experience: z.coerce.number().optional().nullable()
});

export const AddEducationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().optional().nullable(),
  field_of_study: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean(),
  type: z.string(),
  description: z.string().optional().nullable()
});

export const AddContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  is_primary: z.boolean().default(false)
});

export const AddCustomFieldSchema = z.object({
  section: z.string().min(1, "Section is required"),
  field_name: z.string().min(1, "Field name is required"),
  field_value: z.string().optional().nullable()
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
export type AddSkillInput = z.infer<typeof AddSkillSchema>;
export type AddEducationInput = z.infer<typeof AddEducationSchema>;
export type AddContactInput = z.infer<typeof AddContactSchema>;
export type AddCustomFieldInput = z.infer<typeof AddCustomFieldSchema>;

// Simplified schema for EmployeeModal form
export const EmployeeModalSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().optional(),
  role: z.enum(['admin', 'hr', 'employee']),
  department: z.string(),
  job_title: z.string(),
  employment_status: z.enum(['Active', 'Inactive', 'Terminated', 'Resigned']),
  employment_type: z.enum(['Regular', 'Probationary', 'Job Order', 'Contractual']),
  date_hired: z.string(),
  contract_end_date: z.string().optional(),
  regularization_date: z.string().optional(),
});

export type EmployeeModalInput = z.infer<typeof EmployeeModalSchema>;

