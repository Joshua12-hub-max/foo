import { z } from 'zod';
import { createIdValidator, ID_REGEX } from './idValidation.js';
import { PdsQuestionsSchema } from './pdsSchema.js';

const gibberishRegex = /^(.)\1{5,}|^[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{12,}$|qwertyuiop|asdfghjkl|zxcvbnm|qwqewrwff/;

const validateGibberish = (val: string | undefined | null) => {
  if (!val || val === "") return true;
  // Relaxed thresholds: 12 repeated characters or 20 consonants
  if (/(.)\1{11,}/.test(val)) return false;
  if (/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{20,}/.test(val)) return false;
  if (/[!@#$%^&*()_+={}[\]:;"'<>,.?/\\|`~]{6,}/.test(val)) return false;
  return !gibberishRegex.test(val.toLowerCase());
};

const validateProfessionalText = (val: string | undefined | null) => {
  if (!val || val === "") return true;
  // Even more relaxed for technical summaries/skills
  if (/(.)\1{15,}/.test(val)) return false;
  if (/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{30,}/.test(val)) return false;
  return true; 
};

const nameValidator = (val: string | undefined | null) => {
  if (!val || val === "") return true;
  const nameRegex = /^[a-zA-Z\s\-.ñÑ]+$/;
  if (!nameRegex.test(val)) return false;
  return validateGibberish(val);
};

const nameMsg = "Only letters, spaces, hyphens, and dots are allowed. Avoid random characters.";
const gibberishMsg = "Please enter valid text, avoid random characters and excessive symbols.";

const EducationSchema = z.object({
  school: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  from: z.string().optional().nullable(),
  to: z.string().optional().nullable(),
  units: z.string().optional().nullable(),
  yearGrad: z.string().optional().nullable(),
  honors: z.string().optional().nullable()
});

const EligibilitySchema = z.object({
  name: z.string().min(1, "Eligibility name is required"),
  rating: z.string().optional().nullable(),
  examDate: z.string().optional().nullable(),
  examPlace: z.string().optional().nullable(),
  licenseNo: z.string().optional().nullable(),
  licenseValidUntil: z.string().optional().nullable()
});

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or Employee ID is required"),
  password: z.string().min(1, "Password is required")
});

export const RegisterSchema = z.object({
  employeeId: z.string().optional(), // Auto-generated if not provided
  firstName: z.string().min(1, "First name is required").refine(nameValidator, nameMsg),
  lastName: z.string().min(1, "Last name is required").refine(nameValidator, nameMsg),
  middleName: z.string().optional().refine(nameValidator, nameMsg),
  suffix: z.string().optional().refine(nameValidator, nameMsg),
  
  // Address
  address: z.string().optional().refine(validateGibberish, gibberishMsg),
  isMeycauayan: z.union([z.boolean(), z.string()]).optional().default('false').transform((val) => val === true || val === 'true'), 
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
  appointmentType: z.enum(['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS', '']).optional().transform(val => val === "" ? undefined : val),
  startTime: z.string().optional().refine(val => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), "Invalid time format"),
  endTime: z.string().optional().refine(val => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), "Invalid time format"),
  dateHired: z.string().optional(),

  // Personal Info
  birthDate: z.string().optional().or(z.null()).or(z.literal("")),
  placeOfBirth: z.string().optional().or(z.null()).or(z.literal("")),
  gender: z.enum(["Male", "Female", ""]).optional().or(z.null()).transform(val => val === "" ? null : val),
  civilStatus: z.enum(["Single", "Married", "Widowed", "Separated", "Annulled", ""]).optional().or(z.null()).transform(val => val === "" ? null : val),
  religion: z.string().optional().or(z.null()).or(z.literal("")),
  nationality: z.string().optional().or(z.null()).or(z.literal("")),
  citizenship: z.string().optional().or(z.null()).or(z.literal("")).default("Filipino"),
  citizenshipType: z.string().optional().or(z.null()).or(z.literal("")),
  dualCountry: z.string().optional().or(z.null()).or(z.literal("")),
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
  resCity: z.string().optional().or(z.null()),
  resProvince: z.string().optional().or(z.null()),
  resRegion: z.string().optional().or(z.null()),

  permHouseBlockLot: z.string().optional().or(z.null()),
  permStreet: z.string().optional().or(z.null()),
  permSubdivision: z.string().optional().or(z.null()),
  permBarangay: z.string().optional().or(z.null()),
  permCity: z.string().optional().or(z.null()),
  permProvince: z.string().optional().or(z.null()),
  permRegion: z.string().optional().or(z.null()),

  telephoneNo: z.string().optional().or(z.null()),
  mobileNo: z.string().optional().or(z.null()),
  emergencyContact: z.string().optional().or(z.null()).refine(nameValidator, nameMsg),
  emergencyContactNumber: z.string().optional().or(z.null()),

  // Government Identification
  gsisNumber: createIdValidator(ID_REGEX.GSIS, "GSIS Number").or(z.literal('')),
  pagibigNumber: createIdValidator(ID_REGEX.PAGIBIG, "Pag-IBIG Number").or(z.literal('')),
  philhealthNumber: createIdValidator(ID_REGEX.PHILHEALTH, "PhilHealth Number").or(z.literal('')),
  umidNumber: createIdValidator(ID_REGEX.UMID, "UMID Number").or(z.literal('')),
  philsysId: createIdValidator(ID_REGEX.PHILSYS, "PhilSys ID").or(z.literal('')),
  tinNumber: createIdValidator(ID_REGEX.TIN, "TIN").or(z.literal('')),
  agencyEmployeeNo: z.string().optional().or(z.null()).or(z.literal('')).refine(validateGibberish, gibberishMsg),

  // Educational Background — 100% aligned with pds_education table
  educationalBackground: z.string().optional().or(z.null()).or(z.literal("")),
  schoolName: z.string().optional().or(z.null()).or(z.literal("")),
  course: z.string().optional().or(z.null()).or(z.literal("")),
  yearGraduated: z.string().optional().or(z.null()).or(z.literal("")),

  education: z.object({
    Elementary: EducationSchema.optional(),
    Secondary: EducationSchema.optional(),
    Vocational: EducationSchema.optional(),
    College: EducationSchema.optional(),
    Graduate: EducationSchema.optional(),
  }).optional(),

  yearsOfExperience: z.string().optional().or(z.null()),
  experience: z.string().optional().or(z.null()).refine(validateProfessionalText, gibberishMsg),
  skills: z.string().optional().or(z.null()).refine(validateProfessionalText, gibberishMsg),

  // Eligibility
  eligibilityType: z.string().optional().or(z.null()).or(z.literal("")),
  eligibilityNumber: z.string().optional().or(z.null()).or(z.literal("")),
  eligibilityDate: z.string().optional().or(z.null()).or(z.literal("")),

  eligibilities: z.array(EligibilitySchema).optional().default([]),

  // Family Background
  spouseLastName: z.string().optional().nullable().or(z.literal('')),
  spouseFirstName: z.string().optional().nullable().or(z.literal('')),
  spouseMiddleName: z.string().optional().nullable().or(z.literal('')),
  spouseSuffix: z.string().optional().nullable().or(z.literal('')),
  spouseOccupation: z.string().optional().nullable().or(z.literal('')),
  spouseEmployer: z.string().optional().nullable().or(z.literal('')),
  spouseBusAddress: z.string().optional().nullable().or(z.literal('')),
  spouseTelephone: z.string().optional().nullable().or(z.literal('')),
  
  fatherLastName: z.string().optional().nullable().or(z.literal('')),
  fatherFirstName: z.string().optional().nullable().or(z.literal('')),
  fatherMiddleName: z.string().optional().nullable().or(z.literal('')),
  fatherSuffix: z.string().optional().nullable().or(z.literal('')),
  
  motherMaidenLastName: z.string().optional().nullable().or(z.literal('')),
  motherMaidenFirstName: z.string().optional().nullable().or(z.literal('')),
  motherMaidenMiddleName: z.string().optional().nullable().or(z.literal('')),
  motherMaidenSuffix: z.string().optional().nullable().or(z.literal('')),
  
  children: z.array(z.object({
    name: z.string().optional().nullable(),
    birthDate: z.string().optional().nullable()
  })).optional().default([]),

  // PDS Multi-entry sections
  workExperiences: z.array(z.object({
    dateFrom: z.string().min(1),
    dateTo: z.string().optional().nullable().or(z.literal('')),
    positionTitle: z.string(),
    companyName: z.string(),
    monthlySalary: z.string().optional().nullable().or(z.literal('')),
    salaryGrade: z.string().optional().nullable().or(z.literal('')),
    appointmentStatus: z.string().optional().nullable().or(z.literal('')),
    isGovernment: z.boolean().default(false)
  })).optional().default([]),


  trainings: z.array(z.object({
    title: z.string(),
    dateFrom: z.string(),
    dateTo: z.string().optional().nullable().or(z.literal('')),
    hoursNumber: z.string().optional().nullable().or(z.literal('')),
    typeOfLd: z.string().optional().nullable().or(z.literal('')),
    conductedBy: z.string().optional().nullable().or(z.literal(''))
  })).optional().default([]),

  otherSkills: z.array(z.object({ value: z.string() })).optional().default([]),
  recognitions: z.array(z.object({ value: z.string() })).optional().default([]),
  memberships: z.array(z.object({ value: z.string() })).optional().default([]),


  // Social & Others
  facebookUrl: z.string().optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().optional().nullable().or(z.literal('')),
  twitterHandle: z.string().optional().nullable().or(z.literal('')),
  ignoreDuplicateWarning: z.boolean().optional().default(false),

  // PDS Certifications
  govtIdType: z.string().optional().or(z.null()),
  govtIdNo: z.string().optional().or(z.null()),
  govtIdIssuance: z.string().optional().or(z.null()),

  // Applicant data linking (auto-populated when pre-filling from hired applicant)
  applicantId: z.union([z.number(), z.string().transform(v => parseInt(v, 10))]).optional(),
  applicantHiredDate: z.string().optional(),
  applicantStartDate: z.string().optional(),
  applicantPhotoPath: z.string().optional(),
  dateAccomplished: z.string().optional().or(z.null()).or(z.literal("")),
  isOldEmployee: z.boolean().optional().default(false),
  certifiedCorrect: z.boolean().optional().default(false),
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
  identifier: z.string().min(1, "Email or Employee ID is required"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
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
  firstName: z.string().optional().refine(nameValidator, nameMsg),
  lastName: z.string().optional().refine(nameValidator, nameMsg),
  middleName: z.string().optional().refine(nameValidator, nameMsg),
  suffix: z.string().optional().refine(nameValidator, nameMsg),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  mobileNo: z.string().optional(),
  telephoneNo: z.string().optional(),
  birthDate: z.string().optional(),
  placeOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female"]).optional(),
  civilStatus: z.enum(["Single", "Married", "Widowed", "Separated", "Annulled"]).optional(),
  nationality: z.string().optional(),
  citizenship: z.string().optional(),
  citizenshipType: z.string().optional(),
  
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
  
  permHouseBlockLot: z.string().optional(),
  permStreet: z.string().optional(),
  permSubdivision: z.string().optional(),
  permBarangay: z.string().optional(),
  permCity: z.string().optional(),
  
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
  appointmentType: z.enum(['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS']).optional(),
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
  religion: z.string().optional(),
  dutyType: z.enum(['Standard', 'Irregular']).optional(),
  education: z.object({
    Elementary: EducationSchema.optional(),
    Secondary: EducationSchema.optional(),
    Vocational: EducationSchema.optional(),
    College: EducationSchema.optional(),
    Graduate: EducationSchema.optional(),
  }).optional(),
  eligibilities: z.array(EligibilitySchema).optional(),
  dateAccomplished: z.string().optional().or(z.null()).or(z.literal("")),
  pdsQuestions: PdsQuestionsSchema.optional().nullable(),
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
