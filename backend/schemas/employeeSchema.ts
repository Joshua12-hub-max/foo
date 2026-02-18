import { z } from 'zod';

const BaseEmployeeSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  middle_name: z.string().optional().nullable(),
  email: z.string().email("Invalid email format"),
  
  // Job Order & Regularization Fields
  department: z.string().optional().nullable(),
  department_id: z.number().optional().nullable(),
  job_title: z.string().optional().nullable(),
  duties: z.string().optional().nullable(),
  role: z.string(),
  employment_status: z.enum(['Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause']),
  employment_type: z.enum(['Full-time', 'Part-time', 'Contractual', 'Job Order', 'Coterminous', 'Temporary', 'Probationary', 'Casual', 'Permanent']),
  contract_end_date: z.string().optional().nullable(), // Required if Job Order
  regularization_date: z.string().optional().nullable(), // Auto-calc or manual
  is_regular: z.boolean(),
  employee_id: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  position_id: z.number().optional().nullable(),
  
  // Personal Info
  birth_date: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  civil_status: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  permanent_address: z.string().optional().nullable(),
  
  // PDS Fields
  height_m: z.coerce.number().optional().nullable(),
  weight_kg: z.coerce.number().optional().nullable(),
  blood_type: z.string().optional().nullable(),
  place_of_birth: z.string().optional().nullable(),
  residential_address: z.string().optional().nullable(),
  residential_zip_code: z.string().optional().nullable(),
  permanent_zip_code: z.string().optional().nullable(),
  telephone_no: z.string().optional().nullable(),
  mobile_no: z.string().optional().nullable(),
  agency_employee_no: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  emergency_contact_number: z.string().optional().nullable(),
  
  // Government IDs
  sss_number: z.string().optional().nullable(),
  philhealth_number: z.string().optional().nullable(),
  pagibig_number: z.string().optional().nullable(),
  tin_number: z.string().optional().nullable(),
  gsis_number: z.string().optional().nullable(),
  
  // Employment Details
  salary_grade: z.coerce.string().optional().nullable(),
  step_increment: z.number().optional().nullable(),
  appointment_type: z.string().optional().nullable(),
  original_appointment_date: z.string().optional().nullable(),
  last_promotion_date: z.string().optional().nullable(),
  station: z.string().optional().nullable(),
  office_address: z.string().optional().nullable(),
  position_title: z.string().optional().nullable(),
  item_number: z.string().optional().nullable(),
  date_hired: z.string().optional().nullable(),
  
  // Plantilla-required Eligibility Fields
  eligibility_type: z.string().optional().nullable(),
  eligibility_number: z.string().optional().nullable(),
  eligibility_date: z.string().optional().nullable(),
  highest_education: z.string().optional().nullable(),
  years_of_experience: z.number().optional().nullable(),
  
  // Social Media
  facebook_url: z.string().optional().nullable(),
  linkedin_url: z.string().optional().nullable(),
  twitter_handle: z.string().optional().nullable(),
});

export const CreateEmployeeSchema = BaseEmployeeSchema.extend({
  role: z.string().default("employee"),
  employment_status: z.enum(['Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause']).default('Active'),
  employment_type: z.enum(['Full-time', 'Part-time', 'Contractual', 'Job Order', 'Coterminous', 'Temporary', 'Probationary', 'Casual', 'Permanent']).default('Probationary'),
  is_regular: z.boolean().default(false),
});

export const UpdateEmployeeSchema = BaseEmployeeSchema.partial();

export const AddSkillSchema = z.object({
  skill_name: z.string().min(1, "Skill name is required"),
  category: z.string().default("Technical"),
  proficiency_level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).default("Intermediate"),
  years_experience: z.number().optional().nullable()
});

export const AddEducationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().optional().nullable(),
  field_of_study: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().default(false),
  type: z.string().default("Education"),
  description: z.string().optional().nullable()
});

export const AddContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  is_primary: z.boolean().default(false)
});

export const UpdateSkillSchema = AddSkillSchema.partial();
export const UpdateEducationSchema = AddEducationSchema.partial();
export const UpdateContactSchema = AddContactSchema.partial();

export const RevertStatusSchema = z.object({
    new_status: z.string().min(1, "Status is required"),
    reason: z.string().optional()
});

export const AddCustomFieldSchema = z.object({
  section: z.string().min(1, "Section is required"),
  field_name: z.string().min(1, "Field name is required"),
  field_value: z.string().optional().nullable() // Can be null/empty
});

export const UpdateCustomFieldSchema = AddCustomFieldSchema.partial();

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;

export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;

export const PDSUpdateSchema = z.object({
  items: z.array(z.object({}).passthrough()).min(0),
  employee_id: z.coerce.string().optional(),
  employeeId: z.coerce.string().optional()
});

export type PDSUpdateInput = z.infer<typeof PDSUpdateSchema>;
