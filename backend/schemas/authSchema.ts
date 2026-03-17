import { z } from 'zod';
import { createIdValidator, ID_REGEX } from './idValidation.js';

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or Employee ID is required"),
  password: z.string().min(1, "Password is required")
});

export const RegisterSchema = z.object({
  employeeId: z.string().optional(), // Auto-generated if not provided
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  suffix: z.string().optional(),
  
  // Address
  address: z.string().optional(), // Optional because it might be auto-generated from barangay
  isMeycauayan: z.string().optional().default('false').transform((val) => val === 'true'), 
  barangay: z.string().optional(),

  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number")
    .optional().or(z.literal("")),
  role: z.enum(["Administrator", "Human Resource", "Employee"]).default("Employee"),
  
  department: z.string().optional(),
  position: z.string().optional(),
  dutyType: z.enum(["Standard", "Irregular"]).default("Standard"),
  appointmentType: z.enum(['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS']).optional(),

  // Personal Info
  birthDate: z.string().optional().or(z.null()).or(z.literal("")),
  placeOfBirth: z.string().optional().or(z.null()).or(z.literal("")),
  gender: z.enum(["Male", "Female", ""]).optional().or(z.null()),
  civilStatus: z.enum(["Single", "Married", "Widowed", "Separated", "Annulled", ""]).optional().or(z.null()),
  nationality: z.string().optional().or(z.null()).or(z.literal("")),
  bloodType: z.string().optional().or(z.null()).or(z.literal("")),
  heightM: z.string().optional().or(z.null()).or(z.literal("")),
  weightKg: z.string().optional().or(z.null()).or(z.literal("")),

  // Contact & Detailed Address
  residentialAddress: z.string().optional().or(z.null()),
  residentialZipCode: z.string().optional().or(z.null()),
  permanentAddress: z.string().optional().or(z.null()),
  permanentZipCode: z.string().optional().or(z.null()),

  // Atomic Address Fields
  resHouseBlockLot: z.string().optional().or(z.null()),
  resStreet: z.string().optional().or(z.null()),
  resSubdivision: z.string().optional().or(z.null()),
  resBarangay: z.string().optional().or(z.null()),
  resBrgy: z.string().optional().or(z.null()),
  resCity: z.string().optional().or(z.null()),
  resProvince: z.string().optional().or(z.null()),
  resRegion: z.string().optional().or(z.null()),

  permHouseBlockLot: z.string().optional().or(z.null()),
  permStreet: z.string().optional().or(z.null()),
  permSubdivision: z.string().optional().or(z.null()),
  permBarangay: z.string().optional().or(z.null()),
  permBrgy: z.string().optional().or(z.null()),
  permCity: z.string().optional().or(z.null()),
  permProvince: z.string().optional().or(z.null()),
  permRegion: z.string().optional().or(z.null()),

  telephoneNo: z.string().optional().or(z.null()),
  mobileNo: z.string().optional().or(z.null()),
  emergencyContact: z.string().optional().or(z.null()),
  emergencyContactNumber: z.string().optional().or(z.null()),

  // Government Identification
  gsisNumber: createIdValidator(ID_REGEX.GSIS, "GSIS Number"),
  pagibigNumber: createIdValidator(ID_REGEX.PAGIBIG, "Pag-IBIG Number"),
  philhealthNumber: createIdValidator(ID_REGEX.PHILHEALTH, "PhilHealth Number"),
  umidNumber: createIdValidator(ID_REGEX.UMID, "UMID Number"),
  philsysId: createIdValidator(ID_REGEX.PHILSYS, "PhilSys ID"),
  tinNumber: createIdValidator(ID_REGEX.TIN, "TIN"),
  agencyEmployeeNo: z.string().optional().or(z.null()),

  // Educational Background
  educationalBackground: z.string().optional().or(z.null()),
  schoolName: z.string().optional().or(z.null()),
  course: z.string().optional().or(z.null()),
  yearGraduated: z.string().optional().or(z.null()),
  yearsOfExperience: z.string().optional().or(z.null()),
  experience: z.string().optional().or(z.null()),
  skills: z.string().optional().or(z.null()),

  // Eligibility
  eligibilityType: z.string().optional().or(z.null()),
  eligibilityNumber: z.string().optional().or(z.null()),
  eligibilityDate: z.string().optional().or(z.null()),

  // Social & Others
  facebookUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  twitterHandle: z.string().optional(),
  ignoreDuplicateWarning: z.boolean().optional().default(false),

  // Applicant data linking (auto-populated when pre-filling from hired applicant)
  applicantId: z.union([z.number(), z.string().transform(v => parseInt(v, 10))]).optional(),
  applicantHiredDate: z.string().optional(),
  applicantPhotoPath: z.string().optional(),
  dateAccomplished: z.string().optional().or(z.null()).or(z.literal("")),
  pdsQuestions: z.any().optional(),
  isOldEmployee: z.boolean().optional().default(false),
});

export const GoogleLoginSchema = z.object({
  credential: z.string().min(1, "Google credential is required")
});

export const VerifyOTPSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  otp: z.string().length(6, "OTP must be exactly 6 digits")
});

export const EmailVerifySchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be exactly 6 digits")
});

export const ResendOTPSchema = z.object({
  identifier: z.string().min(1, "Identifier is required")
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format")
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number")
});

// Types inferred from schema
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;
export type EmailVerifyInput = z.infer<typeof EmailVerifySchema>;
export type ResendOTPInput = z.infer<typeof ResendOTPSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type GoogleLoginInput = z.infer<typeof GoogleLoginSchema>;

export const UpdateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  middleName: z.string().optional(),
  suffix: z.string().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  mobileNo: z.string().optional(),
  telephoneNo: z.string().optional(),
  birthDate: z.string().optional(),
  placeOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  civilStatus: z.enum(["Single", "Married", "Widowed", "Separated", "Annulled"]).optional(),
  nationality: z.string().optional(),
  
  // Basic Address
  address: z.string().optional(),
  residentialAddress: z.string().optional(),
  residentialZipCode: z.string().optional(),
  permanentAddress: z.string().optional(),
  permanentZipCode: z.string().optional(),

  // Atomic Address Fields
  resHouseBlockLot: z.string().optional(),
  resStreet: z.string().optional(),
  resSubdivision: z.string().optional(),
  resBarangay: z.string().optional(),
  resCity: z.string().optional(),
  resProvince: z.string().optional(),
  resRegion: z.string().optional(),
  resBrgy: z.string().optional(),
  
  permHouseBlockLot: z.string().optional(),
  permStreet: z.string().optional(),
  permSubdivision: z.string().optional(),
  permBarangay: z.string().optional(),
  permCity: z.string().optional(),
  permProvince: z.string().optional(),
  permRegion: z.string().optional(),
  permBrgy: z.string().optional(),
  
  emergencyContact: z.string().optional(),
  emergencyContactNumber: z.string().optional(),
  
  // Identification
  umidNumber: createIdValidator(ID_REGEX.UMID, "UMID Number"),
  philsysId: createIdValidator(ID_REGEX.PHILSYS, "PhilSys ID"),
  gsisNumber: createIdValidator(ID_REGEX.GSIS, "GSIS Number"),
  philhealthNumber: createIdValidator(ID_REGEX.PHILHEALTH, "PhilHealth Number"),
  pagibigNumber: createIdValidator(ID_REGEX.PAGIBIG, "Pag-IBIG Number"),
  tinNumber: createIdValidator(ID_REGEX.TIN, "TIN"),
  agencyEmployeeNo: z.string().optional(),
  
  // Background
  educationalBackground: z.string().optional(),
  schoolName: z.string().optional(),
  course: z.string().optional(),
  yearGraduated: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  
  // Eligibility
  eligibilityType: z.string().optional(),
  eligibilityNumber: z.string().optional(),
  eligibilityDate: z.string().optional(),
  
  // Physical
  bloodType: z.string().optional(),
  heightM: z.string().optional(),
  weightKg: z.string().optional(),
  
  // Social
  facebookUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  twitterHandle: z.string().optional(),
  
  // Employment
  positionTitle: z.string().optional(),
  itemNumber: z.string().optional(),
  salaryGrade: z.string().optional(),
  stepIncrement: z.string().or(z.number()).optional(),
  appointmentType: z.enum(['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary']).optional(),
  employmentStatus: z.enum(['Active', 'Probationary', 'Terminated', 'Resigned', 'On Leave', 'Suspended', 'Verbal Warning', 'Written Warning', 'Show Cause']).optional(),
  station: z.string().optional(),
  officeAddress: z.string().optional(),
  dateHired: z.string().optional(),
  originalAppointmentDate: z.string().optional(),
  lastPromotionDate: z.string().optional(),

  // Section IX: Declarations
  relatedThirdDegree: z.string().optional(),
  relatedThirdDetails: z.string().optional(),
  relatedFourthDegree: z.string().optional(),
  relatedFourthDetails: z.string().optional(),
  foundGuiltyAdmin: z.string().optional(),
  foundGuiltyDetails: z.string().optional(),
  criminallyCharged: z.string().optional(),
  dateFiled: z.string().optional(),
  statusOfCase: z.string().optional(),
  convictedCrime: z.string().optional(),
  convictedDetails: z.string().optional(),
  separatedFromService: z.string().optional(),
  separatedDetails: z.string().optional(),
  electionCandidate: z.string().optional(),
  electionDetails: z.string().optional(),
  resignedToPromote: z.string().optional(),
  resignedDetails: z.string().optional(),
  immigrantStatus: z.string().optional(),
  immigrantDetails: z.string().optional(),
  indigenousMember: z.string().optional(),
  indigenousDetails: z.string().optional(),
  personWithDisability: z.string().optional(),
  disabilityIdNo: z.string().optional(),
  soloParent: z.string().optional(),
  soloParentIdNo: z.string().optional(),

  // Other PDS 2025 Fields
  dualCountry: z.string().optional(),
  govtIdType: z.string().optional(),
  govtIdNo: z.string().optional(),
  govtIdIssuance: z.string().optional(),
  isMeycauayan: z.union([z.boolean(), z.string().transform(v => v === 'true')]).optional(),
  dateAccomplished: z.string().optional().or(z.null()).or(z.literal("")),
  pdsQuestions: z.any().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export const SetupPortalSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  suffix: z.string().optional(),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  departmentId: z.coerce.number().min(1, "Department is required"),
  positionId: z.coerce.number().min(1, "Position is required"),
  role: z.enum(["Administrator", "Human Resource"]).default("Administrator"),
  dutyType: z.enum(["Standard", "Irregular"]).default("Standard"),
  appointmentType: z.enum(['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS']).default('Permanent'),
});

export type SetupPortalInput = z.infer<typeof SetupPortalSchema>;
