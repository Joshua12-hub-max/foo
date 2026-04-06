import { z } from 'zod';
import { createIdValidator, ID_REGEX } from './idValidation';
import { PdsQuestionsSchema } from './pdsSchema';

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or Employee ID is required"),
  password: z.string().min(1, "Password is required")
});

const nameValidator = (val: string | undefined | null) => {
  if (!val || val === "") return true;
  const nameRegex = /^[a-zA-Z\s\-.ñÑ]+$/;
  if (!nameRegex.test(val)) return false;
  return true; // Gibberish check removed for 100% Zero-Validation
};

const nameMsg = "Only letters, spaces, hyphens, and dots are allowed. Avoid random characters.";

export const RegisterSchema = z.object({
  employeeId: z.string().optional(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  middleName: z.string().optional().nullable(),
  suffix: z.string().optional().nullable(),
  
  // Address
  address: z.string().optional().nullable(),
  isMeycauayan: z.string().optional().nullable(),
  barangay: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.string().optional().nullable().or(z.literal("")),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  dutyType: z.string().optional().nullable().or(z.literal("")),
  appointmentType: z.string().optional().nullable().or(z.literal("")),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  dateHired: z.string().optional(),
  avatar: z.instanceof(File).optional(),

  // Personal Info
  birthDate: z.string().optional().nullable(),
  placeOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable().or(z.literal("")),
  civilStatus: z.string().optional().nullable().or(z.literal("")),
  nationality: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  citizenship: z.string().optional().nullable(),
  citizenshipType: z.string().optional().nullable(),
  dualCountry: z.string().optional().nullable(),
  bloodType: z.string().optional().nullable(),
  heightM: z.string().optional().nullable().or(z.number().transform(v => String(v))),
  weightKg: z.string().optional().nullable().or(z.number().transform(v => String(v))),

  // Contact & Detailed Address
  resRegion: z.string().optional().nullable(),
  resProvince: z.string().optional().nullable(),
  resCity: z.string().optional().nullable(),
  resArea: z.string().optional().nullable(),
  resHouseBlockLot: z.string().optional().nullable(),
  resStreet: z.string().optional().nullable(),
  resBarangay: z.string().optional().nullable(),
  resSubdivision: z.string().optional().nullable(),
  permRegion: z.string().optional().nullable(),
  permProvince: z.string().optional().nullable(),
  permCity: z.string().optional().nullable(),
  permBarangay: z.string().optional().nullable(),
  permStreet: z.string().optional().nullable(),
  permHouseBlockLot: z.string().optional().nullable(),
  permSubdivision: z.string().optional().nullable(),
  
  residentialAddress: z.string().optional().nullable(),
  residentialZipCode: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  permanentZipCode: z.string().optional().nullable(),
  telephoneNo: z.string().optional().nullable(),
  mobileNo: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyContactNumber: z.string().optional().nullable(),

  // Government Identification
  gsisNumber: z.string().optional().nullable().or(z.literal('')),
  pagibigNumber: z.string().optional().nullable().or(z.literal('')),
  philhealthNumber: z.string().optional().nullable().or(z.literal('')),
  umidNumber: z.string().optional().nullable().or(z.literal('')),
  philsysId: z.string().optional().nullable().or(z.literal('')),
  tinNumber: z.string().optional().nullable().or(z.literal('')),
  agencyEmployeeNo: z.string().optional().or(z.null()).or(z.literal('')),

  educations: z.array(z.object({
    level: z.string().optional().nullable(),
    schoolName: z.string().optional().nullable(),
    degreeCourse: z.string().optional().nullable(),
    dateFrom: z.union([z.string(), z.number()]).optional().nullable(),
    dateTo: z.union([z.string(), z.number()]).optional().nullable(),
    unitsEarned: z.string().optional().nullable(),
    yearGraduated: z.union([z.string(), z.number()]).optional().nullable(),
    honors: z.string().optional().nullable()
  })).optional().default([]),

  eligibilities: z.array(z.object({
    eligibilityName: z.string().optional().nullable().or(z.literal("")),
    rating: z.union([z.string(), z.number()]).optional().nullable(),
    examDate: z.string().optional().nullable(),
    examPlace: z.string().optional().nullable(),
    licenseNumber: z.string().optional().nullable(),
    validityDate: z.string().optional().nullable()
  })).optional().default([]),

  workExperiences: z.array(z.object({
    dateFrom: z.string().optional().nullable().or(z.literal("")),
    dateTo: z.string().optional().nullable().or(z.literal('')),
    positionTitle: z.string().optional().nullable().or(z.literal("")),
    companyName: z.string().optional().nullable().or(z.literal("")),
    monthlySalary: z.union([z.string(), z.number()]).optional().nullable(),
    salaryGrade: z.string().optional().nullable(),
    appointmentStatus: z.string().optional().nullable(),
    isGovernment: z.boolean().default(false)
  })).optional().default([]),

  trainings: z.array(z.object({
    title: z.string().optional().nullable(),
    dateFrom: z.string().optional().nullable(),
    dateTo: z.string().optional().nullable(),
    hoursNumber: z.union([z.string(), z.number()]).optional().nullable(),
    typeOfLd: z.string().optional().nullable(),
    conductedBy: z.string().optional().nullable()
  })).optional().default([]),

  familyBackground: z.array(z.object({
    relationType: z.enum(['Spouse', 'Father', 'Mother', 'Child']),
    lastName: z.string().optional().nullable(),
    firstName: z.string().optional().nullable(),
    middleName: z.string().optional().nullable(),
    nameExtension: z.string().optional().nullable(),
    occupation: z.string().optional().nullable(),
    employer: z.string().optional().nullable(),
    businessAddress: z.string().optional().nullable(),
    telephoneNo: z.string().optional().nullable(),
    dateOfBirth: z.string().optional().nullable()
  })).optional().default([]),

  otherInfo: z.array(z.object({
    type: z.enum(['Skill', 'Recognition', 'Membership']),
    description: z.string()
  })).optional().default([]),

  yearsOfExperience: z.union([z.string(), z.number()]).transform(v => String(v)).optional(),
  highestDegree: z.string().optional().or(z.null()).or(z.literal("")),
  experience: z.string().optional(),
  skills: z.string().optional(),

  facebookUrl: z.string().optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().optional().nullable().or(z.literal('')),
  twitterHandle: z.string().optional().nullable().or(z.literal('')),
  ignoreDuplicateWarning: z.boolean().optional(),

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

  pdsQuestions: z.any().optional(),

  // PDS Certifications
  govtIdType: z.string().optional().or(z.null()).or(z.literal("")),
  govtIdNo: z.string().optional().or(z.null()).or(z.literal("")),
  govtIdIssuance: z.string().optional().or(z.null()).or(z.literal("")),

  // Applicant data linking
  applicantId: z.union([z.number(), z.string().transform(v => parseInt(v, 10))]).optional(),
  applicantHiredDate: z.string().optional(),
  applicantStartDate: z.string().optional(),
  applicantPhotoPath: z.string().optional(),
  dateAccomplished: z.string().optional(),
  isOldEmployee: z.boolean().optional().default(false),
  certifiedCorrect: z.boolean().optional().default(true),
}).superRefine((data, ctx) => {
});

export const VerifyOTPSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  otp: z.string().length(6, "OTP must be exactly 6 digits")
});

export const EmailVerifySchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be exactly 6 digits")
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format")
});

export const ResendOTPSchema = z.object({
  identifier: z.string().min(1, "Identifier is required")
});

export const ResetPasswordSchema = z.object({
  identifier: z.string().min(1, "Email or Employee ID is required"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirmNewPassword: z.string().min(1, "Confirm New Password is required")
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ["confirmNewPassword"],
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;
export type EmailVerifyInput = z.infer<typeof EmailVerifySchema>;
export type ResendOTPInput = z.infer<typeof ResendOTPSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export interface RegisterData {
  id: number;
  email: string;
  employeeId: string;
  fullName: string;
  department: string | null;
  requiresVerification: boolean;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: RegisterData;
}
