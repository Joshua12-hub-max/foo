import { z } from 'zod';
import { createIdValidator, createStrictIdValidator, ID_REGEX } from './idValidation.js';

const gibberishRegex = /^(.)\1{5,}|^[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{12,}$|qwertyuiop|asdfghjkl|zxcvbnm|qwqewrwff/;

const validateGibberish = (val: string | undefined | null) => {
  if (!val || val === "") return true;
  // Relaxed: 10 repeated characters instead of 7
  if (/(.)\1{10,}/.test(val)) return false;
  // Relaxed: 20 consecutive consonants instead of 15
  if (/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{20,}/.test(val)) return false;
  // Relaxed: 6 consecutive special symbols instead of 4
  if (/[!@#$%^&*()_+={}[\]:;"'<>,.?/\\|`~]{6,}/.test(val)) return false;
  return !gibberishRegex.test(val.toLowerCase());
};

const nameValidator = (val: string | undefined | null) => {
  if (!val || val === "") return true;
  // Relaxed: Added numbers and more chars for names like "III", "Jr.", etc.
  const nameRegex = /^[a-zA-Z\s\-.ñÑ0-9\s]+$/;
  if (!nameRegex.test(val)) return false;
  return validateGibberish(val);
};

const nameMsg = "Only letters, spaces, hyphens, and dots are allowed. Avoid random characters.";
const gibberishMsg = "Please enter valid text, avoid random characters and excessive symbols.";

// Schedule Interview Data Schema
export const scheduleInterviewSchema = z.object({
  date: z.string().min(1, 'Date is required').refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime()) && date >= new Date(new Date().setHours(0, 0, 0, 0));
  }, 'Date must be today or in the future'),
  time: z.string().min(1, 'Time is required').regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  platform: z.enum(['Google Meet', 'Zoom', 'Other', 'Jitsi Meet'], {
    error: () => ({ message: 'Please select a valid platform' })
  }),
  notes: z.string().optional()
});

// Generate Meeting Link Request Schema
export const generateMeetingLinkSchema = z.object({
  applicantId: z.number().positive('Applicant ID is required'),
  date: z.string().min(1, 'Date is required').refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid date format'),
  duration: z.number().min(15).max(480).optional().default(60)
});

// Generate Meeting Link Response Schema
export const generateMeetingLinkResponseSchema = z.object({
  success: z.boolean(),
  meetingLink: z.string().url().optional(),
  meetingId: z.string().optional(),
  message: z.string().optional()
});

// Update Applicant Stage Schema
export const updateApplicantStageSchema = z.object({
  stage: z.enum(['Applied', 'Screening', 'Initial Interview', 'Final Interview', 'Offer', 'Hired', 'Rejected']),
  interviewDate: z.string().optional(),
  interviewLink: z.string().url().optional().or(z.literal('')),
  interviewPlatform: z.enum(['Jitsi Meet', 'Google Meet', 'Zoom', 'Other']).optional(),
  notes: z.string().optional()
});

// Generate Offer Letter Schema
export const generateOfferLetterSchema = z.object({
  position: z.string().min(1, 'Position is required'),
  salary: z.string().min(1, 'Salary is required'),
  startDate: z.string().min(1, 'Start date is required'),
  benefits: z.string().optional(),
  additionalTerms: z.string().optional()
});

// Assign Interviewer Schema
export const assignInterviewerSchema = z.object({
  interviewerId: z.number().positive('Interviewer ID is required')
});

// Save Interview Notes Schema
export const saveInterviewNotesSchema = z.object({
  applicantId: z.number().positive('Applicant ID is required'),
  notes: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  duration: z.number().optional(), // in minutes
});

// Create Job Schema
export const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
  requirements: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contractual', 'Job Order', 'Coterminous', 'Temporary', 'Probationary', 'Casual', 'Permanent', 'Contract of Service', 'JO', 'COS']).default('Full-time'),
  dutyType: z.enum(['Standard', 'Irregular']).default('Standard'),
  applicationEmail: z.string().email('Invalid email address'),
  status: z.enum(['Open', 'Closed', 'On Hold']).default('Open'),
  requireCivilService: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true').default(false),
  requireGovernmentIds: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true').default(false),
  requireEducationExperience: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true').default(false),
  education: z.string().optional(),
  experience: z.string().optional(),
  training: z.string().optional(),
  eligibility: z.string().optional(),
  otherQualifications: z.string().optional(),
});

// Update Job Schema (Partial)
export const updateJobSchema = createJobSchema.partial().extend({
  // No additional fields, just makes everything optional for PATCH/flexible updates
});

// Apply for Job Schema (with Length Caps + Type-Safe)
export const applyJobSchema = z.object({
  jobId: z.string().or(z.number()).transform(val => String(val)),
  firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long').refine(nameValidator, nameMsg),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long').refine(nameValidator, nameMsg),
  middleName: z.string().max(100, 'Middle name is too long').optional().nullable().refine(nameValidator, nameMsg),
  suffix: z.string().max(10, 'Suffix is too long').optional().nullable().refine(nameValidator, nameMsg),
  email: z.string().email('Invalid email address').max(255, 'Email is too long'),
  phoneNumber: z.string().min(1, 'Phone number is required').max(20, 'Phone number is too long'),
  birthDate: z.string().min(1, 'Birth date is required').max(30, 'Birth date is too long'),
  birthPlace: z.string().min(1, 'Birth place is required').max(255, 'Birth place is too long'),
  sex: z.enum(['Male', 'Female']),
  civilStatus: z.enum(['Single', 'Married', 'Widowed', 'Separated', 'Annulled']),
  height: z.string().max(20, 'Height is too long').optional().nullable(),
  weight: z.string().max(20, 'Weight is too long').optional().nullable(),
  bloodType: z.string().max(10, 'Blood type is too long').optional().nullable(),
  nationality: z.string().max(100).default('Filipino'),
  citizenshipType: z.string().optional().nullable(),
  dualCountry: z.string().optional().nullable(),

  // Address Fields
  isMeycauayanResident: z.union([z.boolean(), z.string(), z.number()]).transform(v => v === true || v === 'true' || v === 1).optional(),
  resRegionCode: z.string().max(10).optional().nullable(),
  resRegion: z.string().max(100).optional().nullable(),
  resProvinceCode: z.string().max(10).optional().nullable(),
  resProvince: z.string().max(100).optional().nullable(),
  resCityCode: z.string().max(20).optional().nullable(),
  resCity: z.string().max(100).optional().nullable(),
  resBarangay: z.string().max(100).optional().nullable(),
  resStreet: z.string().max(255).optional().nullable(),
  resHouseBlockLot: z.string().max(100).optional().nullable(),
  resSubdivision: z.string().max(100).optional().nullable(),
  zipCode: z.string().max(10).optional().nullable(),

  permRegionCode: z.string().max(10).optional().nullable(),
  permRegion: z.string().max(100).optional().nullable(),
  permProvinceCode: z.string().max(10).optional().nullable(),
  permProvince: z.string().max(100).optional().nullable(),
  permCityCode: z.string().max(20).optional().nullable(),
  permCity: z.string().max(100).optional().nullable(),
  permBarangay: z.string().max(100).optional().nullable(),
  permStreet: z.string().max(255).optional().nullable(),
  permHouseBlockLot: z.string().max(100).optional().nullable(),
  permSubdivision: z.string().max(100).optional().nullable(),
  permanentZipCode: z.string().max(10).optional().nullable(),

  // Additional Contact
  telephoneNumber: z.string().max(20).optional().nullable(),

  // Emergency Contact
  emergencyContact: z.string().min(1, 'Emergency contact person is required').max(255).refine(nameValidator, nameMsg),
  emergencyContactNumber: z.string().min(1, 'Emergency contact number is required').max(20),

  // Social Links
  facebookUrl: z.string().max(255).optional().nullable(),
  linkedinUrl: z.string().max(255).optional().nullable(),
  twitterHandle: z.string().max(255).optional().nullable(),

  // 100% DATA FLOW: Expanded PDS fields for automated registration
  familyBackground: z.any().optional(),
  children: z.any().optional(),
  voluntaryWorks: z.any().optional(),
  references: z.any().optional(),
  otherInfo: z.any().optional(),
  declarations: z.any().optional(),

  // Government ID Fields
  gsisNumber: createIdValidator(ID_REGEX.GSIS, "GSIS Number"),
  pagibigNumber: createIdValidator(ID_REGEX.PAGIBIG, "Pag-IBIG Number"),
  philhealthNumber: createIdValidator(ID_REGEX.PHILHEALTH, "PhilHealth Number"),
  umidNumber: createIdValidator(ID_REGEX.UMID, "UMID Number"),
  philsysId: createIdValidator(ID_REGEX.PHILSYS, "PhilSys ID"),
  tinNumber: createIdValidator(ID_REGEX.TIN, "TIN"),
  agencyEmployeeNo: z.string().max(50).optional().nullable(),
  govtIdType: z.string().max(255).optional().nullable(),
  govtIdNo: z.string().max(255).optional().nullable(),
  govtIdIssuance: z.string().max(255).optional().nullable(),

  // PDS-Aligned Education (Object with Levels)
  education: z.object({
    Elementary: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
    Secondary: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
    Vocational: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
    College: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
    Graduate: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
  }).optional(),

  // PDS-Aligned Arrays
  eligibilities: z.array(z.object({
    name: z.string().min(1, "Eligibility name is required"),
    rating: z.string().optional().nullable(),
    examDate: z.string().optional().nullable(),
    examPlace: z.string().optional().nullable(),
    licenseNo: z.string().optional().nullable(),
    licenseValidUntil: z.string().optional().nullable()
  })).optional().default([]),

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

  trainings: z.array(z.object({
    title: z.string().min(1, "Title is required"),
    dateFrom: z.string().min(1, "Date from is required"),
    dateTo: z.string().optional().nullable().or(z.literal('')),
    hoursNumber: z.string().optional().nullable().or(z.literal('')),
    typeOfLd: z.string().optional().nullable().or(z.literal('')),
    conductedBy: z.string().optional().nullable().or(z.literal(''))
  })).optional().default([]),
 
  totalExperienceYears: z.string().or(z.number()).transform(val => Number(val)).optional(),
  skills: z.string().max(5000, 'Skills details are too long').optional().refine(validateGibberish, gibberishMsg),
  photo: z.string().max(255).optional(),

  // Anti-Spam
  hpField: z.string().max(0).optional(),
  websiteUrl: z.string().max(0).optional(),
  hToken: z.string().min(1),
});

// Verify OTP Schema
export const verifyOTPSchema = z.object({
  applicantId: z.coerce.number().min(1, "Applicant ID is required"),
  otp: z.string().length(6, "OTP must be exactly 6 digits")
});

export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;

// Confirm Hired Schema
export const confirmHiredSchema = z.object({
  startDate: z.string().min(1, 'Start date is required').refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Invalid start date format'),
  selectedDocs: z.array(z.string()).optional(),
  customNotes: z.string().optional()
});

// Type exports
export type ScheduleInterviewData = z.infer<typeof scheduleInterviewSchema>;
export type GenerateMeetingLinkRequest = z.infer<typeof generateMeetingLinkSchema>;
export type GenerateMeetingLinkResponse = z.infer<typeof generateMeetingLinkResponseSchema>;
export type UpdateApplicantStageData = z.infer<typeof updateApplicantStageSchema>;
export type ConfirmHiredData = z.infer<typeof confirmHiredSchema>;
export type SaveInterviewNotesData = z.infer<typeof saveInterviewNotesSchema>;
export type CreateJobData = z.infer<typeof createJobSchema>;
export type UpdateJobData = z.infer<typeof updateJobSchema>;
export type ApplyJobData = z.infer<typeof applyJobSchema>;

export const createStrictApplyJobSchema = (requireIds: boolean, requireCsc: boolean, requireEdu: boolean) => {
  return applyJobSchema.extend({
    gsisNumber: requireIds ? createStrictIdValidator(ID_REGEX.GSIS, "GSIS Number") : applyJobSchema.shape.gsisNumber,
    pagibigNumber: requireIds ? createStrictIdValidator(ID_REGEX.PAGIBIG, "Pag-IBIG Number") : applyJobSchema.shape.pagibigNumber,
    philhealthNumber: requireIds ? createStrictIdValidator(ID_REGEX.PHILHEALTH, "PhilHealth Number") : applyJobSchema.shape.philhealthNumber,
    // UMID and PhilSys are now optional but validated if provided
    umidNumber: applyJobSchema.shape.umidNumber,
    philsysId: applyJobSchema.shape.philsysId,
    tinNumber: requireIds ? createStrictIdValidator(ID_REGEX.TIN, "TIN") : applyJobSchema.shape.tinNumber,
    
    education: requireEdu ? z.object({
       Elementary: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
       Secondary: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
       Vocational: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
       College: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
       Graduate: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
    }).refine(data => {
       return Object.values(data || {}).some(level => level?.school && level.school.trim().length > 0);
    }, "At least one educational record is required") : applyJobSchema.shape.education,

    eligibilities: requireCsc ? applyJobSchema.shape.eligibilities.removeDefault().unwrap().min(1, "At least one eligibility record is required") : applyJobSchema.shape.eligibilities,
    workExperiences: requireEdu ? applyJobSchema.shape.workExperiences.removeDefault().unwrap().min(1, "At least one work experience record is required") : applyJobSchema.shape.workExperiences,
  });
};
