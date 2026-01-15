import { z } from 'zod';

export const CreateEmployeeSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  department: z.string().min(1, "Department is required"),
  job_title: z.string().optional(),
  role: z.enum(['admin', 'hr', 'employee']),
  employment_status: z.string().optional().default("Active"),
  employee_id: z.string().optional(), // Can be auto-generated
  password: z.string().optional(), // Can be auto-generated
  
  // Personal Info
  birth_date: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  civil_status: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  permanent_address: z.string().optional().nullable(),
  
  // Government IDs
  sss_number: z.string().optional().nullable(),
  philhealth_number: z.string().optional().nullable(),
  pagibig_number: z.string().optional().nullable(),
  tin_number: z.string().optional().nullable(),
  gsis_number: z.string().optional().nullable(),
  
  // Employment Details
  salary_grade: z.number().optional().nullable(),
  step_increment: z.number().optional().nullable(), // Using number as per controller
  appointment_type: z.string().optional().nullable(),
  station: z.string().optional().nullable(),
  position_title: z.string().optional().nullable(),
  item_number: z.string().optional().nullable(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

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

export const RevertStatusSchema = z.object({
    new_status: z.string().min(1, "Status is required"),
    reason: z.string().optional()
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
