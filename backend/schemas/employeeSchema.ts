import { z } from 'zod';
import { createIdValidator, ID_REGEX } from './idValidation.js';

export const BaseEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional().nullable(),
  email: z.string().email("Invalid email format"),
  
  // Job Order & Regularization Fields
  department: z.string().optional().nullable(),
  departmentId: z.number().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  duties: z.string().optional().nullable(),
  role: z.string(),
  employmentStatus: z.enum(['Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause']),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contractual', 'Job Order', 'Coterminous', 'Temporary', 'Probationary', 'Casual', 'Permanent']),
  contractEndDate: z.string().optional().nullable(), // Required if Job Order
  regularizationDate: z.string().optional().nullable(), // Auto-calc or manual
  isRegular: z.boolean(),
  employeeId: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  positionId: z.number().optional().nullable(),
  
  // Personal Info
  birthDate: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  civilStatus: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  barangay: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  citizenship: z.string().optional().nullable(),
  citizenshipType: z.string().optional().nullable(),
  
  // PDS Fields
  heightM: z.coerce.number().optional().nullable(),
  weightKg: z.coerce.number().optional().nullable(),
  bloodType: z.string().optional().nullable(),
  placeOfBirth: z.string().optional().nullable(),
  residentialAddress: z.string().optional().nullable(),
  residentialZipCode: z.string().optional().nullable(),
  permanentZipCode: z.string().optional().nullable(),
  telephoneNo: z.string().optional().nullable(),
  mobileNo: z.string().optional().nullable(),
  agencyEmployeeNo: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyContactNumber: z.string().optional().nullable(),
  resHouseBlockLot: z.string().optional().nullable(),
  resStreet: z.string().optional().nullable(),
  resSubdivision: z.string().optional().nullable(),
  resBarangay: z.string().optional().nullable(),
  resCity: z.string().optional().nullable(),
  resProvince: z.string().optional().nullable(),
  resRegion: z.string().optional().nullable(),
  resBrgy: z.string().optional().nullable(),
  permHouseBlockLot: z.string().optional().nullable(),
  permStreet: z.string().optional().nullable(),
  permSubdivision: z.string().optional().nullable(),
  permBarangay: z.string().optional().nullable(),
  permCity: z.string().optional().nullable(),
  permProvince: z.string().optional().nullable(),
  permRegion: z.string().optional().nullable(),
  permBrgy: z.string().optional().nullable(),
  rightThumbmarkUrl: z.string().optional().nullable(),
  ctcNo: z.string().optional().nullable(),
  ctcIssuedAt: z.string().optional().nullable(),
  ctcIssuedDate: z.string().optional().nullable(),
  
  // Government IDs
  umidNumber: createIdValidator(ID_REGEX.UMID, "UMID Number"),
  philsysId: createIdValidator(ID_REGEX.PHILSYS, "PhilSys ID"),
  philhealthNumber: createIdValidator(ID_REGEX.PHILHEALTH, "PhilHealth Number"),
  pagibigNumber: createIdValidator(ID_REGEX.PAGIBIG, "Pag-IBIG Number"),
  tinNumber: createIdValidator(ID_REGEX.TIN, "TIN"),
  gsisNumber: createIdValidator(ID_REGEX.GSIS, "GSIS Number"),
  educationalBackground: z.string().optional().nullable(),
  schoolName: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  yearGraduated: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
  
  // Employment Details
  salaryGrade: z.coerce.string().optional().nullable(),
  stepIncrement: z.number().optional().nullable(),
  appointmentType: z.string().optional().nullable(),
  originalAppointmentDate: z.string().optional().nullable(),
  lastPromotionDate: z.string().optional().nullable(),
  station: z.string().optional().nullable(),
  officeAddress: z.string().optional().nullable(),
  positionTitle: z.string().optional().nullable(),
  itemNumber: z.string().optional().nullable(),
  dateHired: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  
  // Plantilla-required Eligibility Fields
  eligibilityType: z.string().optional().nullable(),
  eligibilityNumber: z.string().optional().nullable(),
  eligibilityDate: z.string().optional().nullable(),
  yearsOfExperience: z.number().optional().nullable(),
  
  // Social Media
  facebookUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  twitterHandle: z.string().optional().nullable(),
  applicantId: z.number().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
});

export const CreateEmployeeSchema = BaseEmployeeSchema.extend({
  role: z.string().default("employee"),
  employmentStatus: z.enum(['Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause']).default('Active'),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contractual', 'Job Order', 'Coterminous', 'Temporary', 'Probationary', 'Casual', 'Permanent']).default('Probationary'),
  isRegular: z.boolean().default(false),
});

export const UpdateEmployeeSchema = BaseEmployeeSchema.partial();

export const AddSkillSchema = z.object({
  skillName: z.string().min(1, "Skill name is required"),
  category: z.string().default("Technical"),
  proficiencyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).default("Intermediate"),
  yearsExperience: z.number().optional().nullable()
});

export const AddEducationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().optional().nullable(),
  fieldOfStudy: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().default(false),
  type: z.string().default("Education"),
  description: z.string().optional().nullable()
});

export const AddContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false)
});

export const UpdateSkillSchema = AddSkillSchema.partial();
export const UpdateEducationSchema = AddEducationSchema.partial();
export const UpdateContactSchema = AddContactSchema.partial();

export const RevertStatusSchema = z.object({
    newStatus: z.string().min(1, "Status is required"),
    reason: z.string().optional()
});

export const AddCustomFieldSchema = z.object({
  section: z.string().min(1, "Section is required"),
  fieldName: z.string().min(1, "Field name is required"),
  fieldValue: z.string().optional().nullable() // Can be null/empty
});

export const UpdateCustomFieldSchema = AddCustomFieldSchema.partial();

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;

export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;

export const PDSUpdateSchema = z.object({
  items: z.array(z.object({}).passthrough()).min(0),
  employeeId: z.coerce.string().optional()
});

export type PDSUpdateInput = z.infer<typeof PDSUpdateSchema>;
