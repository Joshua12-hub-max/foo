import { z } from 'zod';
import { createIdValidator, createStrictIdValidator, ID_REGEX } from './idValidation.js';

// STRICT AUTHORIZED TESTING VALUES FOR ELIGIBILITY & CERTIFICATIONS
const VALID_ELIGIBILITY_NAMES = [
  "Civil Service Professional", "Civil Service Sub-Professional", "CPA Board Exam", 
  "Driver's License", "LET Board Exam", "Nursing Licensure Exam", "Bar Examination",
  "Engineering Board Exam", "TESDA NC II", "Real Estate Broker"
];

const VALID_ELIGIBILITY_PLACES = [
  "Manila", "Quezon City", "Makati", "Cebu City", "Davao City", 
  "Baguio City", "Iloilo City", "Cagayan de Oro", "Zamboanga City", "Pampanga"
];

const VALID_LICENSE_NUMBERS = [
  "1234567", "9876543", "1122334", "5566778", "9900112",
  "1029384", "5647382", "2039485", "9102837", "5060708"
];

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
  firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  middleName: z.string().max(100, 'Middle name is too long').optional(),
  suffix: z.string().max(10, 'Suffix is too long').optional(),
  email: z.string().email('Invalid email address').max(255, 'Email is too long'),
  phoneNumber: z.string().min(1, 'Phone number is required').max(20, 'Phone number is too long'),
  address: z.string().min(1, 'Address is required').max(500, 'Address is too long'),
  zipCode: z.string().min(1, 'Zip code is required').max(10, 'Zip code is too long'),
  permanentAddress: z.string().max(500, 'Permanent address is too long').optional(),
  permanentZipCode: z.string().max(10, 'Permanent zip code is too long').optional(),
  isMeycauayanResident: z.union([z.boolean(), z.string(), z.number()]).transform(v => v === true || v === 'true' || v === 1).optional(),
  birthDate: z.string().min(1, 'Birth date is required').max(30, 'Birth date is too long'),
  birthPlace: z.string().min(1, 'Birth place is required').max(255, 'Birth place is too long'),
  sex: z.enum(['Male', 'Female']),
  civilStatus: z.enum(['Single', 'Married', 'Widowed', 'Separated', 'Annulled']),
  height: z.string().max(20, 'Height is too long').optional(),
  weight: z.string().max(20, 'Weight is too long').optional(),
  bloodType: z.string().max(10, 'Blood type is too long').optional(),
  gsisNumber: createIdValidator(ID_REGEX.GSIS, "GSIS Number"),
  pagibigNumber: createIdValidator(ID_REGEX.PAGIBIG, "Pag-IBIG Number"),
  philhealthNumber: createIdValidator(ID_REGEX.PHILHEALTH, "PhilHealth Number"),
  umidNumber: createIdValidator(ID_REGEX.UMID, "UMID Number"),
  philsysId: createIdValidator(ID_REGEX.PHILSYS, "PhilSys ID"),
  tinNumber: createIdValidator(ID_REGEX.TIN, "TIN"),
  eligibility: z.string().max(255).optional().refine(val => !val || VALID_ELIGIBILITY_NAMES.includes(val), 'Fake Record rejected. Please use an authorized testing ID.'),
  eligibilityType: z.string().max(100).optional(),
  eligibilityDate: z.string().max(30).optional(),
  eligibilityRating: z.string().max(50).optional(),
  eligibilityPlace: z.string().max(255).optional().refine(val => !val || VALID_ELIGIBILITY_PLACES.includes(val), 'Fake Record rejected. Please use an authorized testing ID.'),
  licenseNo: z.string().max(50).optional().refine(val => !val || VALID_LICENSE_NUMBERS.includes(val), 'Fake ID rejected. Please use an authorized testing ID.'),
  totalExperienceYears: z.string().or(z.number()).transform(val => Number(val)).optional(),
  educationalBackground: z.string().max(5000, 'Education details are too long').optional(),
  schoolName: z.string().max(255).optional(),
  course: z.string().max(255).optional(),
  yearGraduated: z.string().max(10).optional(),
  experience: z.string().max(5000, 'Experience details are too long').optional(),
  skills: z.string().max(5000, 'Skills details are too long').optional(),
  emergencyContact: z.string().min(1, 'Emergency contact person is required').max(255),
  emergencyContactNumber: z.string().min(1, 'Emergency contact number is required').max(20),
  photo: z.string().max(255).optional(),
  resRegion: z.string().max(100).optional(),
  resProvince: z.string().max(100).optional(),
  resCity: z.string().max(100).optional(),
  resBrgy: z.string().max(100).optional(),
  resStreet: z.string().max(255).optional(),
  residentialZipCode: z.string().max(10).optional(),
  permRegion: z.string().max(100).optional(),
  permProvince: z.string().max(100).optional(),
  permCity: z.string().max(100).optional(),
  permBrgy: z.string().max(100).optional(),
  permStreet: z.string().max(255).optional(),
  resHouseBlockLot: z.string().max(100).optional(),
  resSubdivision: z.string().max(100).optional(),
  permHouseBlockLot: z.string().max(100).optional(),
  permSubdivision: z.string().max(100).optional(),
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
    umidNumber: requireIds ? createStrictIdValidator(ID_REGEX.UMID, "UMID Number") : applyJobSchema.shape.umidNumber,
    philsysId: requireIds ? createStrictIdValidator(ID_REGEX.PHILSYS, "PhilSys ID") : applyJobSchema.shape.philsysId,
    tinNumber: requireIds ? createStrictIdValidator(ID_REGEX.TIN, "TIN") : applyJobSchema.shape.tinNumber,
    
    eligibility: requireCsc ? z.string().min(1, 'Eligibility is required').refine(val => VALID_ELIGIBILITY_NAMES.includes(val), 'Fake Record rejected. Please use an authorized testing ID.') : applyJobSchema.shape.eligibility,
    eligibilityType: requireCsc ? z.enum(['none', 'csc_prof', 'csc_sub', 'ra_1080', 'special_laws', 'drivers_license', 'tesda', 'nbi_clearance', 'others']) : applyJobSchema.shape.eligibilityType,
    eligibilityDate: requireCsc ? z.string().min(1, 'Date is required') : applyJobSchema.shape.eligibilityDate,
    eligibilityPlace: requireCsc ? z.string().min(1, 'Place is required').refine(val => VALID_ELIGIBILITY_PLACES.includes(val), 'Fake Record rejected. Please use an authorized testing ID.') : applyJobSchema.shape.eligibilityPlace,
    licenseNo: requireCsc ? z.string().min(1, 'License No is required').refine(val => VALID_LICENSE_NUMBERS.includes(val), 'Fake ID rejected. Please use an authorized testing ID.') : applyJobSchema.shape.licenseNo,
    
    educationalBackground: requireEdu ? z.string().min(1, 'Education is required') : applyJobSchema.shape.educationalBackground,
    schoolName: requireEdu ? z.string().min(1, 'School name is required') : applyJobSchema.shape.schoolName,
    yearGraduated: requireEdu ? z.string().min(1, 'Year graduated is required') : applyJobSchema.shape.yearGraduated,
    experience: requireEdu ? z.string().min(1, 'Experience is required') : applyJobSchema.shape.experience,
    skills: requireEdu ? z.string().min(1, 'Skills are required') : applyJobSchema.shape.skills,
  }).superRefine((data, ctx) => {
    // Conditional Course Requirement
    if (requireEdu) {
        const basicLevels = ["Elementary School Graduate", "High School Graduate", "Senior High School Graduate"];
        if (data.educationalBackground && !basicLevels.includes(data.educationalBackground)) {
            if (!data.course || data.course.trim().length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Course / Degree is required for this level of education",
                    path: ["course"]
                });
            }
        }
    }
  });
};

