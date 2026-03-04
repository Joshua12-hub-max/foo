import { z } from 'zod';
import { EDUCATION_LEVELS } from './recruitment';

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or Employee ID is required"),
  password: z.string().min(1, "Password is required")
});

export const RegisterSchema = z.object({
  employee_id: z.string().optional(),
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
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  role: z.enum(["admin", "Human Resource", "employee"]).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  duties: z.enum(["Standard", "Irregular Duties"]).optional(),
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
  resBrgy: z.string().optional(),
  resStreet: z.string().optional(),
  permRegion: z.string().optional(),
  permProvince: z.string().optional(),
  permCity: z.string().optional(),
  permBrgy: z.string().optional(),
  permStreet: z.string().optional(),
  
  residentialAddress: z.string().optional(),
  residentialZipCode: z.string().optional(),
  permanentAddress: z.string().optional(),
  permanentZipCode: z.string().optional(),
  telephoneNo: z.string().optional(),
  mobileNo: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyContactNumber: z.string().optional(),

  // Government Identification
  gsisIdNo: z.string().optional(),
  pagibigIdNo: z.string().optional(),
  philhealthNo: z.string().optional(),
  umidId: z.string().optional(),
  philsysId: z.string().optional(),
  tinNo: z.string().optional(),
  agencyEmployeeNo: z.string().optional(),

  // Educational Background
  educationalBackground: z.enum(EDUCATION_LEVELS).or(z.literal('')).optional(),
  schoolName: z.string().optional(),
  course: z.string().optional(),
  yearGraduated: z.string().optional(),
  highestEducation: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  experience: z.string().optional(),
  skills: z.string().optional(),

  // Eligibility
  eligibilityType: z.string().optional(),
  eligibilityNumber: z.string().optional(),
  eligibilityDate: z.string().optional(),

  // Social & Others
  facebookUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  twitterHandle: z.string().optional(),
  ignoreDuplicateWarning: z.boolean().optional(),

  // Applicant data linking (auto-populated when pre-filling from hired applicant)
  applicantId: z.number().optional(),
  applicantHiredDate: z.string().optional(),
  applicantPhotoPath: z.string().optional(),
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
