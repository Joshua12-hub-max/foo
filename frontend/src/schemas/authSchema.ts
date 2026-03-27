import { z } from 'zod';
import { createIdValidator, ID_REGEX } from './idValidation';
import { PdsQuestionsSchema } from './pdsSchema';

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or Employee ID is required"),
  password: z.string().min(1, "Password is required")
});

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

export const RegisterSchema = z.object({
  employeeId: z.string().optional(),
  firstName: z.string().min(1, "First name is required").refine(nameValidator, nameMsg),
  lastName: z.string().min(1, "Last name is required").refine(nameValidator, nameMsg),
  middleName: z.string().optional().refine(nameValidator, nameMsg),
  suffix: z.string().optional().refine(nameValidator, nameMsg),
  
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
  appointmentType: z.enum(['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS', '']).optional().transform(val => val === "" ? undefined : val),
  startTime: z.string().optional().refine(val => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), "Invalid time format"),
  endTime: z.string().optional().refine(val => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), "Invalid time format"),
  dateHired: z.string().optional(),
  avatar: z.instanceof(File).optional(),

  // Personal Info
  birthDate: z.string().min(1, "Birth date is required"),
  placeOfBirth: z.string().min(1, "Place of birth is required").refine(validateGibberish, gibberishMsg),
  gender: z.enum(["Male", "Female", ""]).optional().or(z.null()).transform(val => val === "" ? null : val),
  civilStatus: z.enum(["Single", "Married", "Widowed", "Separated", "Annulled", ""]).optional().or(z.null()).transform(val => val === "" ? null : val),
  nationality: z.string().min(1, "Nationality is required").refine(validateGibberish, gibberishMsg),
  religion: z.string().optional().or(z.null()).or(z.literal("")),
  citizenship: z.string().min(1, "Citizenship is required").default("Filipino"),
  citizenshipType: z.string().optional().or(z.null()).or(z.literal("")),
  dualCountry: z.string().optional().or(z.null()).or(z.literal("")),
  bloodType: z.string().min(1, "Blood type is required"),
  heightM: z.string().min(1, "Height is required").or(z.number().transform(v => String(v))),
  weightKg: z.string().min(1, "Weight is required").or(z.number().transform(v => String(v))),



  // Contact & Detailed Address
  resRegion: z.string().optional(),
  resProvince: z.string().optional(),
  resCity: z.string().optional(),
  resArea: z.string().optional(),
  resHouseBlockLot: z.string().min(1, "House/Block/Lot is required").refine(validateGibberish, gibberishMsg),
  resStreet: z.string().min(1, "Street is required").refine(validateGibberish, gibberishMsg),
  resBarangay: z.string().optional(),
  resSubdivision: z.string().optional().refine(validateGibberish, gibberishMsg),
  permRegion: z.string().optional(),
  permProvince: z.string().optional(),
  permCity: z.string().optional(),
  permBarangay: z.string().optional(),
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

  // Educational Background — 100% aligned with pds_education table
  educationalBackground: z.string().optional().or(z.null()).or(z.literal("")),
  schoolName: z.string().optional().or(z.null()).or(z.literal("")),
  course: z.string().optional().or(z.null()).or(z.literal("")),
  yearGraduated: z.string().optional().or(z.null()).or(z.literal("")),
  
  education: z.object({
    Elementary: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.string().optional().nullable(), to: z.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
    Secondary: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.string().optional().nullable(), to: z.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
    Vocational: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.string().optional().nullable(), to: z.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
    College: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.string().optional().nullable(), to: z.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
    Graduate: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.string().optional().nullable(), to: z.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
  }).optional(),

  yearsOfExperience: z.union([z.string(), z.number()]).transform(v => String(v)).refine(v => v.trim().length > 0, "Years of experience is required"),
  highestDegree: z.string().optional().or(z.null()).or(z.literal("")),
  experience: z.string().min(1, "Experience summary is required").refine(validateProfessionalText, gibberishMsg),
  skills: z.string().min(1, "Skills are required").refine(validateProfessionalText, gibberishMsg),

  // Eligibility
  eligibilityType: z.string().optional().or(z.null()).or(z.literal("")),
  eligibilityNumber: z.string().optional().or(z.null()).or(z.literal("")),
  eligibilityDate: z.string().optional().or(z.null()).or(z.literal("")),

  eligibilities: z.array(z.object({
    name: z.string().min(1, "Eligibility name is required"),
    rating: z.string().optional().nullable(),
    examDate: z.string().optional().nullable(),
    examPlace: z.string().optional().nullable(),
    licenseNo: z.string().optional().nullable(),
    licenseValidUntil: z.string().optional().nullable()
  })).optional().default([]),

  // Work Experience (Multi)
  workExperiences: z.array(z.object({
    dateFrom: z.string().min(1, "Date from is required"),
    dateTo: z.string().optional().nullable().or(z.literal('')),
    positionTitle: z.string().min(1, "Position title is required"),
    companyName: z.string().min(1, "Company Name is required"),
    monthlySalary: z.string().optional().nullable().or(z.literal('')),
    salaryGrade: z.string().optional().nullable().or(z.literal('')),
    appointmentStatus: z.string().optional().nullable().or(z.literal('')),
    isGovernment: z.boolean().default(false)
  })).optional().default([]),



  // Learning & Development (Multi)
  trainings: z.array(z.object({
    title: z.string().min(1, "Title is required"),
    dateFrom: z.string().min(1, "Date from is required"),
    dateTo: z.string().optional().nullable().or(z.literal('')),
    hoursNumber: z.string().optional().nullable().or(z.literal('')),
    typeOfLd: z.string().optional().nullable().or(z.literal('')),
    conductedBy: z.string().optional().nullable().or(z.literal(''))
  })).optional().default([]),



  // Social & Others
  facebookUrl: z.string().optional().nullable().or(z.literal('')).refine(validateGibberish, gibberishMsg),
  linkedinUrl: z.string().optional().nullable().or(z.literal('')).refine(validateGibberish, gibberishMsg),
  twitterHandle: z.string().optional().nullable().or(z.literal('')).refine(validateGibberish, gibberishMsg),
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

  otherSkills: z.array(z.object({ value: z.string() })).optional().default([]),
  recognitions: z.array(z.object({ value: z.string() })).optional().default([]),
  memberships: z.array(z.object({ value: z.string() })).optional().default([]),

  pdsQuestions: PdsQuestionsSchema.optional().nullable(),

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
  certifiedCorrect: z.boolean().refine(val => val === true, "You must certify the information is correct"),
}).superRefine((data, ctx) => {
  // Address Verification
  if (data.isMeycauayan === "true") {
    if (!data.resBarangay || data.resBarangay === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Barangay is required for Meycauayan residents",
        path: ["resBarangay"],
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

    if (!data.eligibilities || data.eligibilities.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one eligibility is required for Standard employees",
        path: ["eligibilities"],
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
