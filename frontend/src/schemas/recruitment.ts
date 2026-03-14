import { z } from 'zod';

export const EDUCATION_LEVELS = [
  "Elementary School Graduate",
  "High School Graduate",
  "Senior High School Graduate",
  "Vocational / Technical Course",
  "Some College Units",
  "College Graduate (Bachelor's Degree)",
  "Some Graduate Studies (Master's)",
  "Master's Degree Graduate",
  "Some Doctoral Studies",
  "Doctorate Degree Graduate"
] as const;

export const jobApplicationSchema = z.object({
  jobId: z.string().or(z.number()).optional(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional(),
  suffix: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  permanentAddress: z.string().optional(),
  permanentZipCode: z.string().optional(),
  birthDate: z.string().min(1, 'Birth date is required'),
  birthPlace: z.string().min(1, 'Birth place is required'),
  sex: z.enum(['Male', 'Female']),
  civilStatus: z.enum(['Single', 'Married', 'Widowed', 'Separated', 'Annulled']),
  height: z.string().or(z.number()).optional(),
  weight: z.string().or(z.number()).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'none']),
  nationality: z.string().optional().default('Filipino'),
  
  // Residency Format matching Registration
  isMeycauayanResident: z.boolean(),
  resRegion: z.string().optional(),
  resProvince: z.string().optional(),
  resCity: z.string().min(1, 'City/Municipality is required'),
  resBrgy: z.string().min(1, 'Barangay is required'),
  resHouseBlockLot: z.string().optional(),
  resSubdivision: z.string().optional(),
  resStreet: z.string().optional(),
  residentialZipCode: z.string().optional(),

  permRegion: z.string().optional(),
  permProvince: z.string().optional(),
  permCity: z.string().optional(),
  permBrgy: z.string().optional(),
  permHouseBlockLot: z.string().optional(),
  permSubdivision: z.string().optional(),
  permStreet: z.string().optional(),
  // Gov IDs with masking/format hints
  gsisNumber: z.string().optional(),
  pagibigNumber: z.string().optional(),
  philhealthNumber: z.string().optional(),
  umidNumber: z.string().optional(),
  philsysId: z.string().optional(),
  tinNumber: z.string().optional(),

  // Eligibility (Refined for CSC/JO)
  eligibility: z.string().optional(),
  eligibilityType: z.enum([
    'none', 
    'csc_prof', 
    'csc_sub', 
    'ra_1080', 
    'special_laws', 
    'drivers_license', 
    'tesda', 
    'nbi_clearance', 
    'others'
  ]),
  eligibilityDate: z.string().optional(),
  eligibilityRating: z.string().optional(),
  eligibilityPlace: z.string().optional(),
  licenseNo: z.string().optional(),

  // Background
  totalExperienceYears: z.string().or(z.number()).optional(),
  totalTrainingHours: z.string().or(z.number()).optional(),
  educationalBackground: z.enum(EDUCATION_LEVELS).or(z.literal('')).optional(),
  schoolName: z.string().optional(),
  course: z.string().optional(),
  yearGraduated: z.string().optional(),
  experience: z.string().optional(),
  skills: z.string().optional(),
  emergencyContact: z.string().min(1, 'Emergency contact person is required'),
  emergencyContactNumber: z.string().min(1, 'Emergency contact number is required'),

  // Anti-Spam
  hpField: z.string().max(0, 'Spam detected').optional(),
  websiteUrl: z.string().max(0, 'Spam detected').optional(),
  hToken: z.string().optional(),
  
  photo: z.instanceof(File, { message: '2x2 Photo is required' }),
  photoPreview: z.string().optional(),
  resume: z.instanceof(File, { message: 'Resume is required' }),
  eligibilityCert: z.instanceof(File).optional(),
});

export type JobApplicationSchema = z.infer<typeof jobApplicationSchema>;

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
  eligibilityReq?: string
) => {
  const isPermanent = employmentType === 'Permanent';
  const needIds = isPermanent || requireIds;
  const needCsc = isPermanent || requireCsc;
  const needEdu = isPermanent || requireEdu;
  const needExp = isPermanent || requireExp;

  const minEduRank = getEducationRank(educationReq);
  const validEducationLevels = minEduRank > 0 
    ? EDUCATION_LEVELS.slice(minEduRank) as unknown as readonly [string, ...string[]]
    : EDUCATION_LEVELS;

  const minExpYears = getRequiredExperienceYears(experienceReq);
  const minTrainingHours = getRequiredTrainingHours(trainingReq);
  const minEligibilityRank = getEligibilityRank(eligibilityReq);

  return jobApplicationSchema.extend({
    gsisNumber: needIds ? z.string().min(1, 'GSIS Number is required') : z.string().optional(),
    pagibigNumber: needIds ? z.string().min(1, 'Pag-IBIG is required') : z.string().optional(),
    philhealthNumber: needIds ? z.string().min(1, 'PhilHealth is required') : z.string().optional(),
    umidNumber: needIds ? z.string().min(1, 'UMID is required') : z.string().optional(),
    philsysId: needIds ? z.string().min(1, 'PhilSys ID is required') : z.string().optional(),
    tinNumber: needIds ? z.string().min(1, 'TIN is required') : z.string().optional(),
    
    eligibilityType: needCsc ? z.enum(['csc_prof', 'csc_sub', 'ra_1080', 'special_laws', 'drivers_license', 'tesda', 'others'], { message: 'Eligibility is required' }) : jobApplicationSchema.shape.eligibilityType,
    
    educationalBackground: needEdu ? z.enum(validEducationLevels, { message: `Minimum education requirement: ${educationReq}` }) : jobApplicationSchema.shape.educationalBackground,
    schoolName: needEdu ? z.string().min(1, 'School name is required') : z.string().optional(),
    yearGraduated: needEdu ? z.string().min(1, 'Year graduated is required') : z.string().optional(),
    experience: needExp ? z.string().min(1, 'Professional experience is required') : z.string().optional(),
    skills: needExp ? z.string().min(1, 'Relevant skills are required') : z.string().optional(),
  }).superRefine((data, ctx) => {
    // Conditional Course Requirement
    if (needEdu) {
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

    // Hierarchical Experience Check
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

    // Hierarchical Training Check
    if (minTrainingHours > 0) {
      const hours = Number(data.totalTrainingHours);
      if (isNaN(hours) || hours < minTrainingHours) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Minimum ${minTrainingHours} hours of relevant training required.`,
          path: ['totalTrainingHours']
        });
      }
    }

    // Hierarchical Eligibility Check
    if (needCsc && minEligibilityRank > 0) {
      const applicantRank = getApplicantEligibilityRank(data.eligibilityType);
      if (applicantRank < minEligibilityRank) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Eligibility requirement not met. Minimum required: ${eligibilityReq}`,
          path: ['eligibilityType']
        });
      }
    }
  });
};

// --- Hierarchical Ranking Utilities ---

export const getEducationRank = (requiredLevel: string | undefined): number => {
  switch (requiredLevel) {
    case 'Elementary Graduate': return 0;
    case 'High School Graduate': return 1;
    case 'Senior High School Graduate': return 2;
    case 'Vocational/Technical': return 3;
    case 'College Graduate': return 5;
    case "Master's Degree": return 7;
    case 'Doctorate Degree': return 9;
    default: return -1;
  }
};

export const getRequiredExperienceYears = (req: string | undefined): number => {
  if (req === '6 months relevant experience') return 0.5;
  if (req === '1 year relevant experience') return 1;
  if (req === '2 years relevant experience') return 2;
  if (req === '3 years relevant experience') return 3;
  if (req === '4 years relevant experience') return 4;
  if (req === '5+ years relevant experience') return 5;
  return 0;
};

export const getRequiredTrainingHours = (req: string | undefined): number => {
  if (req === '4 hours relevant training') return 4;
  if (req === '8 hours relevant training') return 8;
  if (req === '16 hours relevant training') return 16;
  if (req === '24 hours relevant training') return 24;
  if (req === '40 hours relevant training') return 40;
  return 0;
};

export const getEligibilityRank = (eligibility: string | undefined): number => {
  switch (eligibility) {
     case 'Career Service (Sub-Professional)': return 1;
     case 'Career Service (Professional)': return 2;
     case 'Board/Bar RA 1080': return 3;
     case 'Special Laws (CES/CSEE)': return 4;
     default: return 0;
  }
};

export const getApplicantEligibilityRank = (eligibilityType: string | undefined): number => {
  switch (eligibilityType) {
     case 'csc_sub': return 1;
     case 'csc_prof': return 2;
     case 'ra_1080': return 3;
     case 'special_laws': return 4;
     default: return 0;
  }
};

// Public Job Schema for type safety in public views
export interface PublicJob {
    id: number | string;
    title: string;
    department: string;
    location?: string;
    employmentType?: string;
    dutyType?: 'Standard' | 'Irregular';
    salaryRange?: string;
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

