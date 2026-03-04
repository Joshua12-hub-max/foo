import { z } from 'zod';

// STRICT AUTHORIZED TESTING IDS
const VALID_PAGIBIG = [
  "1234-5678-9012", "9876-5432-1098", "1122-3344-5566", "4455-6677-8899", "7788-9900-1122",
  "1029-3847-5610", "5647-3829-1029", "2039-4857-6019", "9102-8374-6510", "5060-7080-9010"
];

const VALID_PHILHEALTH = [
  "12-123456789-0", "98-765432109-8", "11-223344556-6", "44-556677889-9", "77-889900112-2",
  "10-293847561-0", "56-473829102-9", "20-394857601-9", "91-028374651-0", "50-607080901-0"
];

const VALID_TIN = [
  "123-456-789-000", "987-654-321-000", "112-233-445-000", "445-566-778-000", "778-899-001-001",
  "102-938-475-000", "564-738-291-001", "203-948-576-000", "910-283-746-000", "506-070-809-002"
];

const VALID_UMID = [
  "1234-5678901-2", "9876-5432109-8", "1122-3344556-6", "4455-6677889-9", "7788-9900112-2",
  "1029-3847561-0", "5647-3829102-9", "2039-4857601-9", "9102-8374651-0", "5060-7080901-0"
];

const VALID_PHILSYS = [
  "1234-5678-9012-3456", "9876-5432-1098-7654", "1122-3344-5566-7788", "4455-6677-8899-0011", "7788-9900-1122-3344",
  "1029-3847-5610-2938", "5647-3829-1029-3847", "2039-4857-6019-2837", "9102-8374-6510-2938", "5060-7080-9010-2030"
];

const VALID_GSIS = [
  "12-3456789-0", "98-7654321-0", "11-2233445-5", "44-5566778-8", "77-8899001-1",
  "10-2938475-6", "56-4738291-0", "20-3948576-0", "91-0283746-5", "50-6070809-0"
];

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
  interview_date: z.string().optional(),
  interview_link: z.string().url().optional().or(z.literal('')),
  interview_platform: z.enum(['Jitsi Meet', 'Google Meet', 'Zoom', 'Other']).optional(),
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
  job_description: z.string().min(10, 'Job description must be at least 10 characters'),
  requirements: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  employment_type: z.enum(['Full-time', 'Part-time', 'Contractual', 'Job Order', 'Coterminous', 'Temporary', 'Probationary', 'Casual', 'Permanent']).default('Full-time'),
  application_email: z.string().email('Invalid email address'),
  status: z.enum(['Open', 'Closed', 'On Hold']).default('Open'),
  require_civil_service: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true').default(false),
  require_government_ids: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true').default(false),
  require_education_experience: z.union([z.boolean(), z.string()]).transform(v => v === true || v === 'true').default(false),
});

// Update Job Schema (Partial)
export const updateJobSchema = createJobSchema.partial().extend({
  // No additional fields, just makes everything optional for PATCH/flexible updates
});

// Apply for Job Schema (with Length Caps + Type-Safe)
export const applyJobSchema = z.object({
  job_id: z.string().or(z.number()).transform(val => String(val)),
  first_name: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  last_name: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  middle_name: z.string().max(100, 'Middle name is too long').optional(),
  suffix: z.string().max(10, 'Suffix is too long').optional(),
  email: z.string().email('Invalid email address').max(255, 'Email is too long'),
  phone_number: z.string().min(1, 'Phone number is required').max(20, 'Phone number is too long'),
  address: z.string().min(1, 'Address is required').max(500, 'Address is too long'),
  zip_code: z.string().min(1, 'Zip code is required').max(10, 'Zip code is too long'),
  permanent_address: z.string().max(500, 'Permanent address is too long').optional(),
  permanent_zip_code: z.string().max(10, 'Permanent zip code is too long').optional(),
  is_meycauayan_resident: z.union([z.boolean(), z.string(), z.number()]).transform(v => v === true || v === 'true' || v === 1).optional(),
  birth_date: z.string().min(1, 'Birth date is required').max(30, 'Birth date is too long'),
  birth_place: z.string().min(1, 'Birth place is required').max(255, 'Birth place is too long'),
  sex: z.enum(['Male', 'Female']),
  civil_status: z.enum(['Single', 'Married', 'Widowed', 'Separated', 'Annulled']),
  height: z.string().max(20, 'Height is too long').optional(),
  weight: z.string().max(20, 'Weight is too long').optional(),
  blood_type: z.string().max(10, 'Blood type is too long').optional(),
  gsis_no: z.string().max(50).optional().refine(val => !val || VALID_GSIS.includes(val), 'Fake ID rejected. Please use an authorized testing ID.'),
  pagibig_no: z.string().max(50).optional().refine(val => !val || VALID_PAGIBIG.includes(val), 'Fake ID rejected. Please use an authorized testing ID.'),
  philhealth_no: z.string().max(50).optional().refine(val => !val || VALID_PHILHEALTH.includes(val), 'Fake ID rejected. Please use an authorized testing ID.'),
  umid_no: z.string().max(50).optional().refine(val => !val || VALID_UMID.includes(val), 'Fake ID rejected. Please use an authorized testing ID.'),
  philsys_id: z.string().max(50).optional().refine(val => !val || VALID_PHILSYS.includes(val), 'Fake ID rejected. Please use an authorized testing ID.'),
  tin_no: z.string().max(50).optional().refine(val => !val || VALID_TIN.includes(val), 'Fake ID rejected. Please use an authorized testing ID.'),
  eligibility: z.string().max(255).optional().refine(val => !val || VALID_ELIGIBILITY_NAMES.includes(val), 'Fake Record rejected. Please use an authorized testing ID.'),
  eligibility_type: z.string().max(100).optional(),
  eligibility_date: z.string().max(30).optional(),
  eligibility_rating: z.string().max(50).optional(),
  eligibility_place: z.string().max(255).optional().refine(val => !val || VALID_ELIGIBILITY_PLACES.includes(val), 'Fake Record rejected. Please use an authorized testing ID.'),
  license_no: z.string().max(50).optional().refine(val => !val || VALID_LICENSE_NUMBERS.includes(val), 'Fake ID rejected. Please use an authorized testing ID.'),
  total_experience_years: z.string().or(z.number()).transform(val => Number(val)).optional(),
  education: z.string().max(5000, 'Education details are too long').optional(),
  school_name: z.string().max(255).optional(),
  course: z.string().max(255).optional(),
  year_graduated: z.string().max(10).optional(),
  experience: z.string().max(5000, 'Experience details are too long').optional(),
  skills: z.string().max(5000, 'Skills details are too long').optional(),
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
  permanentZipCode: z.string().max(10).optional(),
  hp_field: z.string().max(0).optional(),
  website_url: z.string().max(0).optional(),
  h_token: z.string().min(1),
});

// Type exports
export type ScheduleInterviewData = z.infer<typeof scheduleInterviewSchema>;
export type GenerateMeetingLinkRequest = z.infer<typeof generateMeetingLinkSchema>;
export type GenerateMeetingLinkResponse = z.infer<typeof generateMeetingLinkResponseSchema>;
export type UpdateApplicantStageData = z.infer<typeof updateApplicantStageSchema>;
export type SaveInterviewNotesData = z.infer<typeof saveInterviewNotesSchema>;
export type CreateJobData = z.infer<typeof createJobSchema>;
export type UpdateJobData = z.infer<typeof updateJobSchema>;
export type ApplyJobData = z.infer<typeof applyJobSchema>;

export const createStrictApplyJobSchema = (requireIds: boolean, requireCsc: boolean, requireEdu: boolean) => {
  return applyJobSchema.extend({
    gsis_no: requireIds ? z.string().min(1, 'GSIS Number is required').refine(val => VALID_GSIS.includes(val), 'Fake ID rejected. Please use an authorized testing ID.') : applyJobSchema.shape.gsis_no,
    pagibig_no: requireIds ? z.string().min(1, 'Pag-IBIG Number is required').refine(val => VALID_PAGIBIG.includes(val), 'Fake ID rejected. Please use an authorized testing ID.') : applyJobSchema.shape.pagibig_no,
    philhealth_no: requireIds ? z.string().min(1, 'PhilHealth Number is required').refine(val => VALID_PHILHEALTH.includes(val), 'Fake ID rejected. Please use an authorized testing ID.') : applyJobSchema.shape.philhealth_no,
    umid_no: requireIds ? z.string().min(1, 'UMID is required').refine(val => VALID_UMID.includes(val), 'Fake ID rejected. Please use an authorized testing ID.') : applyJobSchema.shape.umid_no,
    philsys_id: requireIds ? z.string().min(1, 'PhilSys ID is required').refine(val => VALID_PHILSYS.includes(val), 'Fake ID rejected. Please use an authorized testing ID.') : applyJobSchema.shape.philsys_id,
    tin_no: requireIds ? z.string().min(1, 'TIN is required').refine(val => VALID_TIN.includes(val), 'Fake ID rejected. Please use an authorized testing ID.') : applyJobSchema.shape.tin_no,
    
    eligibility: requireCsc ? z.string().min(1, 'Eligibility is required').refine(val => VALID_ELIGIBILITY_NAMES.includes(val), 'Fake Record rejected. Please use an authorized testing ID.') : applyJobSchema.shape.eligibility,
    eligibility_type: requireCsc ? z.enum(['csc_prof', 'csc_sub', 'ra_1080', 'special_laws', 'drivers_license', 'tesda', 'others']) : applyJobSchema.shape.eligibility_type,
    eligibility_date: requireCsc ? z.string().min(1, 'Date is required') : applyJobSchema.shape.eligibility_date,
    eligibility_place: requireCsc ? z.string().min(1, 'Place is required').refine(val => VALID_ELIGIBILITY_PLACES.includes(val), 'Fake Record rejected. Please use an authorized testing ID.') : applyJobSchema.shape.eligibility_place,
    license_no: requireCsc ? z.string().min(1, 'License No is required').refine(val => VALID_LICENSE_NUMBERS.includes(val), 'Fake ID rejected. Please use an authorized testing ID.') : applyJobSchema.shape.license_no,
    
    education: requireEdu ? z.string().min(1, 'Education is required') : applyJobSchema.shape.education,
    experience: requireEdu ? z.string().min(1, 'Experience is required') : applyJobSchema.shape.experience,
    skills: requireEdu ? z.string().min(1, 'Skills are required') : applyJobSchema.shape.skills,
  });
};

