import { z } from 'zod';
import { createIdValidator, ID_REGEX } from './idValidation';

export const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  department: z.string().min(1, "Department is required"),
  departmentId: z.coerce.number().optional().nullable(),
  jobTitle: z.string().optional(),
  role: z.enum(['Administrator', 'Human Resource', 'Employee']),
  employmentStatus: z.string().default("Active"),
  employmentType: z.enum(['Regular', 'Probationary', 'Job Order', 'Contractual']).default('Probationary'),
  contractEndDate: z.string().optional().nullable(),
  regularizationDate: z.string().optional().nullable(),
  isRegular: z.boolean().default(false),
  employeeId: z.string().optional(),
  password: z.string().optional(),
  
  // Personal Info
  birthDate: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  civilStatus: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyContactNumber: z.string().optional().nullable(),
  educationalBackground: z.string().optional().nullable(),
  
  // Extended PDS Fields
  placeOfBirth: z.string().optional().nullable(),
  bloodType: z.string().optional().nullable(),
  heightM: z.coerce.number().optional().nullable(),
  weightKg: z.coerce.number().optional().nullable(),
  telephoneNo: z.string().optional().nullable(),
  residentialAddress: z.string().optional().nullable(),
  residentialZipCode: z.string().optional().nullable(),
  resHouseBlockLot: z.string().optional().nullable(),
  resStreet: z.string().optional().nullable(),
  resSubdivision: z.string().optional().nullable(),
  resBarangay: z.string().optional().nullable(),
  resCity: z.string().optional().nullable(),
  resProvince: z.string().optional().nullable(),
  permanentZipCode: z.string().optional().nullable(),
  permHouseBlockLot: z.string().optional().nullable(),
  permStreet: z.string().optional().nullable(),
  permSubdivision: z.string().optional().nullable(),
  permBarangay: z.string().optional().nullable(),
  permCity: z.string().optional().nullable(),
  permProvince: z.string().optional().nullable(),
  agencyEmployeeNo: z.string().optional().nullable(),
  rightThumbmarkUrl: z.string().optional().nullable(),
  ctcNo: z.string().optional().nullable(),
  ctcIssuedAt: z.string().optional().nullable(),
  ctcIssuedDate: z.string().optional().nullable(),
  
  // Government Identification
  philhealthNumber: createIdValidator(ID_REGEX.PHILHEALTH, "PhilHealth Number"),
  pagibigNumber: createIdValidator(ID_REGEX.PAGIBIG, "Pag-IBIG Number"),
  tinNumber: createIdValidator(ID_REGEX.TIN, "TIN"),
  gsisNumber: createIdValidator(ID_REGEX.GSIS, "GSIS Number"),
  
  // Employment Details
  salaryGrade: z.coerce.number().optional().nullable(),
  stepIncrement: z.coerce.number().optional().nullable(),
  appointmentType: z.string().optional().nullable(),
  station: z.string().optional().nullable(),
  positionTitle: z.string().optional().nullable(),
  positionId: z.coerce.number().optional().nullable(),
  itemNumber: z.string().optional().nullable(),
  dateHired: z.string().optional().nullable(),
  
  // Plantilla-required Eligibility Fields
  eligibilityType: z.string().optional().nullable(),
  eligibilityNumber: z.string().optional().nullable(),
  eligibilityDate: z.string().optional().nullable(),
  highestEducation: z.string().optional().nullable(),
  yearsOfExperience: z.coerce.number().optional().nullable(),
  
  // Social Media
  facebookUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  twitterHandle: z.string().optional().nullable(),
});

export const UpdateEmployeeSchema = CreateEmployeeSchema.partial();

export const AddSkillSchema = z.object({
  skillName: z.string().min(1, "Skill name is required"),
  category: z.string().default("Technical"),
  proficiencyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).default("Intermediate"),
  yearsExperience: z.coerce.number().optional().nullable()
});

export const AddEducationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().optional().nullable(),
  fieldOfStudy: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean(),
  type: z.string(),
  description: z.string().optional().nullable()
});

export const AddContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false)
});

export const AddCustomFieldSchema = z.object({
  section: z.string().min(1, "Section is required"),
  fieldName: z.string().min(1, "Field name is required"),
  fieldValue: z.string().optional().nullable()
});

// PDS Section Schemas
export const AddFamilyMemberSchema = z.object({
  relationType: z.enum(['Spouse', 'Father', 'Mother', 'Child']),
  lastName: z.string().min(1, "Last name is required"),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional().nullable(),
  nameExtension: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  employer: z.string().optional().nullable(),
  businessAddress: z.string().optional().nullable(),
  telephoneNo: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
});

export const AddExperienceSchema = z.object({
  dateFrom: z.string().min(1, "Start date is required"),
  dateTo: z.string().optional().nullable(),
  positionTitle: z.string().min(1, "Position title is required"),
  companyName: z.string().min(1, "Company name is required"),
  monthlySalary: z.string().optional().nullable(),
  salaryGrade: z.string().optional().nullable(),
  appointmentStatus: z.string().optional().nullable(),
  isGovernment: z.boolean().default(false),
});

export const AddVoluntaryWorkSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  address: z.string().optional().nullable(),
  dateFrom: z.string().min(1, "Start date is required"),
  dateTo: z.string().optional().nullable(),
  hoursNumber: z.coerce.number().optional().nullable(),
  position: z.string().optional().nullable(),
});

export const AddTrainingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  dateFrom: z.string().min(1, "Start date is required"),
  dateTo: z.string().optional().nullable(),
  hoursNumber: z.coerce.number().optional().nullable(),
  typeOfLd: z.string().optional().nullable(),
  conductedBy: z.string().optional().nullable(),
});

export const AddOtherInfoSchema = z.object({
  type: z.enum(['Skill', 'Recognition', 'Membership']),
  description: z.string().min(1, "Description is required"),
});

export const AddReferenceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().optional().nullable(),
  telNo: z.string().optional().nullable(),
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
export type AddSkillInput = z.infer<typeof AddSkillSchema>;
export type AddEducationInput = z.infer<typeof AddEducationSchema>;
export type AddContactInput = z.infer<typeof AddContactSchema>;
export type AddCustomFieldInput = z.infer<typeof AddCustomFieldSchema>;

export type AddFamilyMemberInput = z.infer<typeof AddFamilyMemberSchema>;
export type AddExperienceInput = z.infer<typeof AddExperienceSchema>;
export type AddVoluntaryWorkInput = z.infer<typeof AddVoluntaryWorkSchema>;
export type AddTrainingInput = z.infer<typeof AddTrainingSchema>;
export type AddOtherInfoInput = z.infer<typeof AddOtherInfoSchema>;
export type AddReferenceInput = z.infer<typeof AddReferenceSchema>;

// Simplified schema for EmployeeModal form
export const EmployeeModalSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().optional(),
  role: z.enum(['Administrator', 'Human Resource', 'Employee']),
  department: z.string(),
  jobTitle: z.string(),
  employmentStatus: z.enum(['Active', 'Inactive', 'Terminated', 'Resigned']),
  employmentType: z.enum(['Regular', 'Probationary', 'Job Order', 'Contractual']),
  dateHired: z.string(),
  contractEndDate: z.string().optional(),
  regularizationDate: z.string().optional(),
});

export type EmployeeModalInput = z.infer<typeof EmployeeModalSchema>;

