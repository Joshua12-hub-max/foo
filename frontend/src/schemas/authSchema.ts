import { z } from 'zod';
import { EDUCATION_LEVELS } from './recruitment';
import { createIdValidator, ID_REGEX } from './idValidation';
import { PdsQuestionsSchema } from './pdsSchema';

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or Employee ID is required"),
  password: z.string().min(1, "Password is required")
});

export const RegisterSchema = z.object({
  employeeId: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  suffix: z.string().optional(),
  
  // Address
  address: z.string().optional(),
  isMeycauayan: z.string(), // "true" or "false"
  barangay: z.string().optional(),

  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number")
    .optional().or(z.literal("")),
  role: z.enum(["Administrator", "Human Resource", "Employee"]).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  dutyType: z.enum(["Standard", "Irregular"]),
  appointmentType: z.enum(['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS', '']).optional(),
  dateHired: z.string().optional(),
  avatar: z.instanceof(File).optional(),

  // Personal Info
  birthDate: z.string().optional(),
  placeOfBirth: z.string().optional(),
  gender: z.enum(["Male", "Female", ""]).optional(),
  civilStatus: z.enum(["Single", "Married", "Widowed", "Separated", "Annulled", ""]).optional(),
  nationality: z.string().optional(),
  bloodType: z.string().optional(),
  heightM: z.string().optional(),
  weightKg: z.string().optional(),

  // Contact & Detailed Address
  resRegion: z.string().optional(),
  resProvince: z.string().optional(),
  resCity: z.string().optional(),
  resArea: z.string().optional(),
  resHouseBlockLot: z.string().optional(),
  resSubdivision: z.string().optional(),
  resBrgy: z.string().optional(),
  resStreet: z.string().optional(),
  permRegion: z.string().optional(),
  permProvince: z.string().optional(),
  permCity: z.string().optional(),
  permBrgy: z.string().optional(),
  permStreet: z.string().optional(),
  permHouseBlockLot: z.string().optional(),
  permSubdivision: z.string().optional(),
  
  residentialAddress: z.string().optional(),
  residentialZipCode: z.string().optional(),
  permanentAddress: z.string().optional(),
  permanentZipCode: z.string().optional(),
  telephoneNo: z.string().optional(),
  mobileNo: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyContactNumber: z.string().optional(),

  // Government Identification
  gsisNumber: createIdValidator(ID_REGEX.GSIS, "GSIS Number").optional().nullable().or(z.literal('')),
  pagibigNumber: createIdValidator(ID_REGEX.PAGIBIG, "Pag-IBIG Number").optional().nullable().or(z.literal('')),
  philhealthNumber: createIdValidator(ID_REGEX.PHILHEALTH, "PhilHealth Number").optional().nullable().or(z.literal('')),
  umidNumber: createIdValidator(ID_REGEX.UMID, "UMID Number").optional().nullable().or(z.literal('')),
  philsysId: createIdValidator(ID_REGEX.PHILSYS, "PhilSys ID").optional().nullable().or(z.literal('')),
  tinNumber: createIdValidator(ID_REGEX.TIN, "TIN").optional().nullable().or(z.literal('')),
  agencyEmployeeNo: z.string().optional().nullable().or(z.literal('')),

  // Educational Background
  educationalBackground: z.enum(EDUCATION_LEVELS).or(z.literal('')).optional(),
  schoolName: z.string().optional(),
  course: z.string().optional(),
  yearGraduated: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  experience: z.string().optional(),
  skills: z.string().optional(),

  // Eligibility
  eligibilityType: z.string().optional(),
  eligibilityNumber: z.string().optional(),
  eligibilityDate: z.string().optional(),

  // Social & Others
  facebookUrl: z.string().optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().optional().nullable().or(z.literal('')),
  twitterHandle: z.string().optional().nullable().or(z.literal('')),
  ignoreDuplicateWarning: z.boolean().optional(),

  // Applicant data linking (auto-populated when pre-filling from hired applicant)
  applicantId: z.number().optional(),
  applicantHiredDate: z.string().optional(),
  applicantStartDate: z.string().optional(),
  applicantPhotoPath: z.string().optional(),
  dateAccomplished: z.string().optional(),
  pdsQuestions: PdsQuestionsSchema,
  isOldEmployee: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  if (data.isMeycauayan === "true") {
    if (!data.barangay || data.barangay.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Barangay is required",
        path: ["barangay"],
      });
    }
  } else {
    if (!data.address || data.address.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address is required",
        path: ["address"],
      });
    }
  }

  // Duty Type Conditional Validation
  if (data.dutyType === "Standard") {
    const requiredGovIds = [
      { key: "gsisNumber", name: "GSIS" },
      { key: "pagibigNumber", name: "Pag-IBIG" },
      { key: "philhealthNumber", name: "PhilHealth" },
      { key: "tinNumber", name: "TIN" }
    ];

    requiredGovIds.forEach(({ key, name }) => {
      const val = data[key as keyof typeof data];
      if (!val || val === "" || (typeof val === "string" && val.trim() === "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${name} Number is required for Standard employees`,
          path: [key],
        });
      }
    });

    if (!data.eligibilityType || data.eligibilityType === "none" || data.eligibilityType === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Eligibility is required for Standard employees",
        path: ["eligibilityType"],
      });
    }
  }
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
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
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
