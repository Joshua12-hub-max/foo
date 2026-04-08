import { z } from 'zod';
import { createIdValidator, createStrictIdValidator, ID_REGEX } from './idValidation';

export const EDUCATION_LEVELS = [
  "Elementary School Graduate",
  "High School Graduate",
  "Senior High School Graduate",
  "Vocational/Trade Course Graduate",
  "College Graduate",
  "Graduate Studies"
] as const;

const gibberishRegex = /^(.)\1{5,}|^[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{12,}$|qwertyuiop|asdfghjkl|zxcvbnm|qwqewrwff/;

const validateGibberish = (val: string | undefined | null) => {
  if (!val || val === "") return true;
  if (/(.)\1{7,}/.test(val)) return false;
  if (/[bcdfghjklmnpqrstvwxzBCDFGHJKLMNPQRSTVWXZ]{15,}/.test(val)) return false;
  if (/[!@#$%^&*()_+={}[\]:;"'<>,.?/\\|`~]{4,}/.test(val)) return false;
  return !gibberishRegex.test(val.toLowerCase());
};

const nameValidator = (val: string | undefined | null) => {
  if (!val || val === "") return true;
  const nameRegex = /^[a-zA-Z\s\-.ñÑ]{2,100}$/;
  if (!nameRegex.test(val)) return false;
  return validateGibberish(val);
};

const nameMsg = "Only letters, spaces, hyphens, and dots are allowed. Avoid random characters.";
const gibberishMsg = "Please enter valid text, avoid random characters and excessive symbols.";

export const jobApplicationSchema = z.object({
  jobId: z.string().or(z.number()).optional(),
  dutyType: z.enum(['Standard', 'Irregular']).optional().default('Standard'),

  // ── PERSONAL INFORMATION ──
  firstName: z.string().min(1, 'First name is required').refine(nameValidator, nameMsg),
  lastName: z.string().min(1, 'Last name is required').refine(nameValidator, nameMsg),
  middleName: z.string().optional().nullable().refine(nameValidator, nameMsg),
  suffix: z.string().optional().nullable().refine(nameValidator, nameMsg),
  birthDate: z.string().min(1, 'Birth date is required'),
  birthPlace: z.string().min(1, 'Birth place is required').refine(validateGibberish, gibberishMsg),
  sex: z.enum(['Male', 'Female'], {
    errorMap: () => ({ message: 'Sex is required. Please select Male or Female.' })
  }),
  civilStatus: z.enum(['Single', 'Married', 'Widowed', 'Separated', 'Annulled'], {
    errorMap: () => ({ message: 'Civil status is required. Please select your civil status.' })
  }),
  nationality: z.string().min(1, "Nationality is required").default('Filipino').refine(validateGibberish, gibberishMsg),
  citizenshipType: z.enum(['Filipino', 'Dual Citizenship', '']).optional().transform(val => val === "" ? undefined : val),
  dualCountry: z.string().optional().nullable(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'none', '']).optional().transform(val => (val === 'none' || val === "") ? undefined : val),
  height: z.string().optional().refine(validateGibberish, gibberishMsg),
  weight: z.string().optional().refine(validateGibberish, gibberishMsg),

  // ── CONTACT & ADDRESS ──
  isMeycauayanResident: z.boolean().or(z.string().transform(v => v === 'true')),

  // Residential Address (matches PhilippineAddressSelector prefix="res")
  resRegion: z.string().optional().nullable(),
  resProvince: z.string().optional().nullable(),
  resCity: z.string().min(1, 'City/Municipality is required'),
  resBarangay: z.string().min(1, 'Barangay is required'),
  resHouseBlockLot: z.string().optional().nullable().refine(validateGibberish, gibberishMsg),
  resSubdivision: z.string().optional().nullable().refine(validateGibberish, gibberishMsg),
  resStreet: z.string().optional().nullable().refine(validateGibberish, gibberishMsg),
  zipCode: z.string().optional().nullable(),

  // Permanent Address (matches PhilippineAddressSelector prefix="perm")
  permRegion: z.string().optional().nullable(),
  permProvince: z.string().optional().nullable(),
  permCity: z.string().optional().nullable(),
  permBarangay: z.string().optional().nullable(),
  permHouseBlockLot: z.string().optional().nullable().refine(validateGibberish, gibberishMsg),
  permSubdivision: z.string().optional().nullable().refine(validateGibberish, gibberishMsg),
  permStreet: z.string().optional().nullable().refine(validateGibberish, gibberishMsg),
  permanentZipCode: z.string().optional().nullable(),

  // Contact
  email: z.string().min(1, 'Email address is required').email('Invalid email address'),
  phoneNumber: z.string()
    .min(1, 'Phone number is required')
    .refine(val => {
      const cleaned = val.replace(/\s|-/g, '');
      return /^(09|\+639)\d{9}$/.test(cleaned);
    }, 'Invalid phone number. Use format: 09XX XXX XXXX'),
  telephoneNumber: z.string().max(20).optional().nullable(),

  // Emergency Contact
  emergencyContact: z.string().min(1, 'Emergency contact person is required').max(255).refine(nameValidator, nameMsg),
  emergencyContactNumber: z.string()
    .min(1, 'Emergency contact number is required')
    .refine(val => {
      const cleaned = val.replace(/\s|-/g, '');
      return /^(09|\+639)\d{9}$/.test(cleaned);
    }, 'Invalid phone number. Use format: 09XX XXX XXXX'),

  // ── GOVERNMENT IDENTIFICATION ──
  gsisNumber: createIdValidator(ID_REGEX.GSIS, "GSIS Number").or(z.literal('')),
  pagibigNumber: createIdValidator(ID_REGEX.PAGIBIG, "Pag-IBIG Number").or(z.literal('')),
  philhealthNumber: createIdValidator(ID_REGEX.PHILHEALTH, "PhilHealth Number").or(z.literal('')),
  umidNumber: createIdValidator(ID_REGEX.UMID, "UMID Number").or(z.literal('')),
  philsysId: createIdValidator(ID_REGEX.PHILSYS, "PhilSys ID").or(z.literal('')),
  tinNumber: createIdValidator(ID_REGEX.TIN, "TIN").or(z.literal('')),
  agencyEmployeeNo: z.string().max(50).optional().nullable(),
  govtIdType: z.string().max(255).optional().nullable(),
  govtIdNo: z.string().max(255).optional().nullable(),
  govtIdIssuance: z.string().max(255).optional().nullable(),

  // ── SOCIAL LINKS ──
  facebookUrl: z.string().max(255).optional().nullable()
    .refine(val => !val || val === '' || /^https?:\/\/(www\.)?(facebook|fb)\.com\/.+/.test(val),
      'Please enter a valid Facebook URL (e.g., https://facebook.com/yourprofile)'),
  linkedinUrl: z.string().max(255).optional().nullable()
    .refine(val => !val || val === '' || /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/.+/.test(val),
      'Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/yourprofile)'),
  twitterHandle: z.string().max(255).optional().nullable()
    .refine(val => !val || val === '' || /^@?[\w]{1,15}$/.test(val),
      'Please enter a valid Twitter handle (e.g., @yourhandle or yourhandle)'),

  // ── EDUCATIONAL BACKGROUND ──
  educationalBackground: z.string().optional(),
  education: z.object({
    Elementary: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
    Secondary: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
    Vocational: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
    College: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
    Graduate: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
  }).optional(),

  // ── CIVIL SERVICE ELIGIBILITY ──
  eligibilities: z.array(z.object({
    name: z.string().min(1, "Eligibility name is required"),
    rating: z.string().optional().nullable(),
    examDate: z.string().optional().nullable(),
    examPlace: z.string().optional().nullable(),
    licenseNo: z.string().optional().nullable(),
    licenseValidUntil: z.string().optional().nullable()
  })).optional().default([]),

  // ── WORK EXPERIENCE ──
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

  // ── LEARNING & DEVELOPMENT / TRAINING PROGRAMS ──
  trainings: z.array(z.object({
    title: z.string().min(1, "Title is required"),
    dateFrom: z.string().min(1, "Date from is required"),
    dateTo: z.string().optional().nullable().or(z.literal('')),
    hoursNumber: z.string().optional().nullable().or(z.literal('')),
    typeOfLd: z.string().optional().nullable().or(z.literal('')),
    conductedBy: z.string().optional().nullable().or(z.literal(''))
  })).optional().default([]),

  // ── ADDITIONAL INFORMATION ──
  totalExperienceYears: z.string().or(z.number()).transform(val => Number(val)).optional(),
  skills: z.string().max(5000, 'Skills details are too long').optional().refine(validateGibberish, gibberishMsg),

  // File Uploads (Strictly Typed)
  photo: z.instanceof(File).or(z.string()).optional(),
  photoPreview: z.string().optional(),
  resume: z.instanceof(File, { message: 'Resume is required. Please upload your resume/CV.' }).or(z.string().min(1)),
  eligibilityCert: z.instanceof(File).or(z.string()).optional(),

  // Anti-Spam
  hpField: z.string().max(0).optional(),
  websiteUrl: z.string().max(0).optional(),
  hToken: z.string().min(1),
});

export type JobApplicationSchema = z.infer<typeof jobApplicationSchema>;
export type JobApplicationInput = z.input<typeof jobApplicationSchema>;

// Dynamic Schema Factory Function
export const createDynamicJobApplicationSchema = (
  employmentType: string | undefined,
  requireIds?: boolean,
  requireCsc?: boolean,
  requireEdu?: boolean,
  requireExp?: boolean,
  educationReq?: string,
  experienceReq?: string,
  trainingReq?: string,
  eligibilityReq?: string,
  dutyType?: string
) => {
  const isPermanent = employmentType === 'Permanent';
  const isStandard = dutyType === 'Standard';
  const needIds = isPermanent || isStandard || requireIds;
  const needCsc = isPermanent || isStandard || requireCsc;
  const needEdu = isPermanent || isStandard || requireEdu;
  const needExp = isPermanent || isStandard || requireExp;

  const minEduRank = getEducationRank(educationReq);
  const minExpYears = getRequiredExperienceYears(experienceReq);
  const minEligibilityRank = getEligibilityRank(eligibilityReq);

  return jobApplicationSchema.extend({
    gsisNumber: needIds ? createStrictIdValidator(ID_REGEX.GSIS, "GSIS Number") : jobApplicationSchema.shape.gsisNumber,
    pagibigNumber: needIds ? createStrictIdValidator(ID_REGEX.PAGIBIG, "Pag-IBIG Number") : jobApplicationSchema.shape.pagibigNumber,
    philhealthNumber: needIds ? createStrictIdValidator(ID_REGEX.PHILHEALTH, "PhilHealth Number") : jobApplicationSchema.shape.philhealthNumber,
    umidNumber: needIds ? createStrictIdValidator(ID_REGEX.UMID, "UMID Number") : jobApplicationSchema.shape.umidNumber,
    philsysId: needIds ? createStrictIdValidator(ID_REGEX.PHILSYS, "PhilSys ID") : jobApplicationSchema.shape.philsysId,
    tinNumber: needIds ? createStrictIdValidator(ID_REGEX.TIN, "TIN") : jobApplicationSchema.shape.tinNumber,

    education: needEdu ? z.object({
       Elementary: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
       Secondary: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
       Vocational: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
       College: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
       Graduate: z.object({ school: z.string().optional().nullable(), course: z.string().optional().nullable(), from: z.coerce.string().optional().nullable(), to: z.coerce.string().optional().nullable(), units: z.string().optional().nullable(), yearGrad: z.coerce.string().optional().nullable(), honors: z.string().optional().nullable() }).optional(),
    }).refine(data => {
       return Object.values(data || {}).some(level => level?.school && level.school.trim().length > 0);
    }, "At least one educational record is required") : jobApplicationSchema.shape.education,

    eligibilities: needCsc ? jobApplicationSchema.shape.eligibilities.removeDefault().unwrap().min(1, "At least one eligibility record is required") : jobApplicationSchema.shape.eligibilities,
    workExperiences: needExp ? jobApplicationSchema.shape.workExperiences.removeDefault().unwrap().min(1, "At least one work experience record is required") : jobApplicationSchema.shape.workExperiences,
  }).superRefine((data, ctx) => {
    if (needEdu && minEduRank >= 0) {
      const applicantEduRank = getApplicantEducationRank(data.education);
      if (applicantEduRank < minEduRank) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Minimum education requirement not met: ${educationReq}`,
          path: ['education']
        });
      }
    }

    if (needExp && minExpYears > 0) {
      const years = Number(data.totalExperienceYears);
      if (isNaN(years) || years < minExpYears) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Minimum ${minExpYears} year(s) of relevant experience required.`,
          path: ['totalExperienceYears']
        });
      }
    }

    if (needCsc && minEligibilityRank > 0) {
      const maxRank = data.eligibilities?.reduce((max, el) => {
          const rank = getApplicantEligibilityRank(el.name);
          return Math.max(max, rank);
      }, 0) || 0;

      if (maxRank < minEligibilityRank) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Eligibility requirement not met. Minimum required: ${eligibilityReq}`,
          path: ['eligibilities']
        });
      }
    }
  });
};

// --- Hierarchical Ranking Utilities ---

export const getEducationRank = (requiredLevel: string | undefined): number => {
  switch (requiredLevel) {
    case 'Elementary School Graduate': return 0;
    case 'High School Graduate': return 1;
    case 'Senior High School Graduate': return 2;
    case 'Vocational/Trade Course Graduate': return 3;
    case 'College Graduate': return 5;
    case 'Graduate Studies': return 9;
    default: return -1;
  }
};

export const getApplicantEducationRank = (education: JobApplicationSchema["education"]): number => {
  if (!education) return -1;
  if (education.Graduate?.school) return 9;
  if (education.College?.school) return 5;
  if (education.Vocational?.school) return 3;
  if (education.Secondary?.school) return 1;
  if (education.Elementary?.school) return 0;
  return -1;
};

export const getRequiredExperienceYears = (req: string | undefined): number => {
  if (req?.includes('6 months')) return 0.5;
  if (req?.includes('1 year')) return 1;
  if (req?.includes('2 years')) return 2;
  if (req?.includes('3 years')) return 3;
  if (req?.includes('4 years')) return 4;
  if (req?.includes('5+ years')) return 5;
  return 0;
};

export const getRequiredTrainingHours = (req: string | undefined): number => {
  const match = req?.match(/(\d+)\s*hours/);
  return match ? parseInt(match[1]) : 0;
};

export const getEligibilityRank = (eligibility: string | undefined): number => {
  if (!eligibility) return 0;
  switch (eligibility) {
     case 'Career Service (Sub-Professional)': return 1;
     case 'Career Service (Professional)': return 2;
     case 'Board/Bar RA 1080':
     case 'Board / Bar (RA 1080)': return 3;
     case 'Special Laws (CES/CSEE)': return 4;
     default: return 0;
  }
};

export const getApplicantEligibilityRank = (eligibilityName: string | undefined): number => {
  if (!eligibilityName) return 0;
  const name = eligibilityName.toLowerCase();
  
  // Check internal value identifiers first
  if (name === 'special_laws') return 4;
  if (name === 'ra_1080') return 3;
  if (name === 'csc_prof') return 2;
  if (name === 'csc_sub') return 1;

  // Then check descriptive labels
  if (name.includes('special laws') || name.includes('ces') || name.includes('csee')) return 4;
  if (name.includes('board') || name.includes('bar') || name.includes('1080')) return 3;
  if (name.includes('sub-professional') || name.includes('subprofessional')) return 1;
  if (name.includes('professional')) return 2; // Check professional last to avoid matching sub-professional
  
  return 0;
};

// Public Job Schema for type safety in public views
export interface PublicJob {
    id: number | string;
    title: string;
    department: string;
    location?: string;
    employmentType?: string;
    dutyType?: 'Standard' | 'Irregular';
    postedAt?: string;
    createdAt?: string;
    jobDescription: string;
    requirements: string;
    status: string;
    attachmentPath?: string | null;
    education?: string | null;
    experience?: string | null;
    training?: string | null;
    eligibility?: string | null;
    otherQualifications?: string | null;
    requireCivilService: boolean;
    requireGovernmentIds: boolean;
    requireEducationExperience: boolean;
}
