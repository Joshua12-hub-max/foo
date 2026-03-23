import { z } from 'zod';
import { EDUCATION_LEVELS } from './recruitment';
import { createIdValidator, ID_REGEX } from './idValidation';
import { PdsQuestionsSchema } from './pdsSchema';

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or Employee ID is required"),
  password: z.string().min(1, "Password is required")
});

const gibberishRegex = /^(.)\1{5,}|^[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{12,}$|qwertyuiop|asdfghjkl|zxcvbnm|qwqewrwff/;

const validateGibberish = (val: string | undefined | null) => {
  if (!val || val === "") return true;
  // Check for repeated characters like "aaaaaaa"
  if (/(.)\1{7,}/.test(val)) return false;
  // Check for long strings of consonants
  if (/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{15,}/.test(val)) return false;
  return !gibberishRegex.test(val.toLowerCase());
};

const gibberishMsg = "Please enter valid text, avoid random characters";

export const RegisterSchema = z.object({
  employeeId: z.string().optional(),
  firstName: z.string().min(1, "First name is required").refine(validateGibberish, gibberishMsg),
  lastName: z.string().min(1, "Last name is required").refine(validateGibberish, gibberishMsg),
  middleName: z.string().optional().refine(validateGibberish, gibberishMsg),
  suffix: z.string().optional().refine(validateGibberish, gibberishMsg),
  
  // Address
  address: z.string().optional().refine(validateGibberish, gibberishMsg),
  isMeycauayan: z.string(), // "true" or "false"
  barangay: z.string().optional(),

  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number")
    .optional().or(z.literal("")),
  role: z.enum(["Administrator", "Human Resource", "Employee"]).optional(),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  dutyType: z.enum(["Standard", "Irregular"]),
  appointmentType: z.enum(['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS', '']).refine(val => val !== '', "Appointment type is required"),
  startTime: z.string().optional().refine(val => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), "Invalid time format"),
  endTime: z.string().optional().refine(val => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), "Invalid time format"),
  dateHired: z.string().optional(),
  avatar: z.instanceof(File).optional(),

  // Personal Info
  birthDate: z.string().min(1, "Birth date is required"),
  placeOfBirth: z.string().min(1, "Place of birth is required").refine(validateGibberish, gibberishMsg),
  gender: z.enum(["Male", "Female", ""]).refine(val => val !== '', "Gender is required"),
  civilStatus: z.enum(["Single", "Married", "Widowed", "Separated", "Annulled", ""]).refine(val => val !== '', "Civil status is required"),
  nationality: z.string().min(1, "Nationality is required").refine(validateGibberish, gibberishMsg),
  bloodType: z.string().min(1, "Blood type is required"),
  heightM: z.string().min(1, "Height is required"),
  weightKg: z.string().min(1, "Weight is required"),

  // Contact & Detailed Address
  resRegion: z.string().optional(),
  resProvince: z.string().optional(),
  resCity: z.string().optional(),
  resArea: z.string().optional(),
  resHouseBlockLot: z.string().min(1, "House/Block/Lot is required").refine(validateGibberish, gibberishMsg),
  resStreet: z.string().min(1, "Street is required").refine(validateGibberish, gibberishMsg),
  resBarangay: z.string().optional(),
  resSubdivision: z.string().optional().refine(validateGibberish, gibberishMsg),
  resBrgy: z.string().optional(),
  permRegion: z.string().optional(),
  permProvince: z.string().optional(),
  permCity: z.string().optional(),
  permBrgy: z.string().optional(),
  permStreet: z.string().min(1, "Permanent street is required").refine(validateGibberish, gibberishMsg),
  permHouseBlockLot: z.string().min(1, "Permanent house/block/lot is required").refine(validateGibberish, gibberishMsg),
  permSubdivision: z.string().optional().refine(validateGibberish, gibberishMsg),
  
  residentialAddress: z.string().optional().refine(validateGibberish, gibberishMsg),
  residentialZipCode: z.string().min(1, "Zip code is required"),
  permanentAddress: z.string().optional().refine(validateGibberish, gibberishMsg),
  permanentZipCode: z.string().min(1, "Permanent zip code is required"),
  telephoneNo: z.string().optional().refine(validateGibberish, gibberishMsg),
  mobileNo: z.string().min(1, "Mobile number is required"),
  emergencyContact: z.string().min(1, "Emergency contact is required").refine(validateGibberish, gibberishMsg),
  emergencyContactNumber: z.string().min(1, "Emergency contact number is required"),

  // Government Identification
  gsisNumber: createIdValidator(ID_REGEX.GSIS, "GSIS Number").optional().nullable().or(z.literal('')),
  pagibigNumber: createIdValidator(ID_REGEX.PAGIBIG, "Pag-IBIG Number").optional().nullable().or(z.literal('')),
  philhealthNumber: createIdValidator(ID_REGEX.PHILHEALTH, "PhilHealth Number").optional().nullable().or(z.literal('')),
  umidNumber: createIdValidator(ID_REGEX.UMID, "UMID Number").optional().nullable().or(z.literal('')),
  philsysId: createIdValidator(ID_REGEX.PHILSYS, "PhilSys ID").optional().nullable().or(z.literal('')),
  tinNumber: createIdValidator(ID_REGEX.TIN, "TIN").optional().nullable().or(z.literal('')),
  agencyEmployeeNo: z.string().optional().nullable().or(z.literal('')).refine(validateGibberish, gibberishMsg),

  // Educational Background
  educationalBackground: z.enum(EDUCATION_LEVELS).or(z.literal('')).refine(val => val !== '', "Educational background is required"),
  schoolName: z.string().min(1, "School name is required").refine(validateGibberish, gibberishMsg),
  course: z.string().optional().refine(validateGibberish, gibberishMsg),
  yearGraduated: z.string().min(1, "Year graduated is required"),
  yearsOfExperience: z.string().min(1, "Years of experience is required"),
  experience: z.string().min(1, "Experience summary is required").refine(validateGibberish, gibberishMsg),
  skills: z.string().min(1, "Skills are required").refine(validateGibberish, gibberishMsg),

  // Eligibility
  eligibilityType: z.string().min(1, "Eligibility type is required"),
  eligibilityNumber: z.string().min(1, "License/ID number is required").refine(validateGibberish, gibberishMsg),
  eligibilityDate: z.string().optional(),

  // Social & Others
  facebookUrl: z.string().optional().nullable().or(z.literal('')).refine(validateGibberish, gibberishMsg),
  linkedinUrl: z.string().optional().nullable().or(z.literal('')).refine(validateGibberish, gibberishMsg),
  twitterHandle: z.string().optional().nullable().or(z.literal('')).refine(validateGibberish, gibberishMsg),
  ignoreDuplicateWarning: z.boolean().optional(),

  // Applicant data linking
  applicantId: z.number().optional(),
  applicantHiredDate: z.string().optional(),
  applicantStartDate: z.string().optional(),
  applicantPhotoPath: z.string().optional(),
  dateAccomplished: z.string().optional(),
  pdsQuestions: PdsQuestionsSchema,
  isOldEmployee: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  // Address Verification
  if (data.isMeycauayan === "true") {
    if (!data.resBrgy || data.resBrgy === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Barangay is required for Meycauayan residents",
        path: ["resBrgy"],
      });
    }
  } else {
    if (!data.resRegion || data.resRegion === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Region is required", path: ["resRegion"] });
    }
    if (!data.resProvince || data.resProvince === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Province is required", path: ["resProvince"] });
    }
    if (!data.resCity || data.resCity === "") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "City/Municipality is required", path: ["resCity"] });
    }
  }

  // Permanent Address Logic
  if (!data.permRegion || data.permRegion === "") {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Permanent Region is required", path: ["permRegion"] });
  }

  // Duty Type Conditional Validation (GSIS, TIN, etc. only for Standard)
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
