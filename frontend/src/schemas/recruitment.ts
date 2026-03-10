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
  
  photo: z.instanceof(File).optional(),
  photoPreview: z.string().optional(),
  resume: z.instanceof(File).optional(),
  eligibilityCert: z.instanceof(File).optional(),
});

export type JobApplicationSchema = z.infer<typeof jobApplicationSchema>;

// Dynamic Schema Factory Function
export const createDynamicJobApplicationSchema = (
  employmentType: string | undefined,
  requireIds?: boolean,
  requireCsc?: boolean,
  requireEdu?: boolean
) => {
  const isPermanent = employmentType === 'Permanent';
  const needIds = isPermanent || requireIds;
  const needCsc = isPermanent || requireCsc;
  const needEdu = isPermanent || requireEdu;

  return jobApplicationSchema.extend({
    gsisNumber: needIds ? z.string().min(1, 'GSIS Number is required') : z.string().optional(),
    pagibigNumber: needIds ? z.string().min(1, 'Pag-IBIG is required') : z.string().optional(),
    philhealthNumber: needIds ? z.string().min(1, 'PhilHealth is required') : z.string().optional(),
    umidNumber: needIds ? z.string().min(1, 'UMID is required') : z.string().optional(),
    philsysId: needIds ? z.string().min(1, 'PhilSys ID is required') : z.string().optional(),
    tinNumber: needIds ? z.string().min(1, 'TIN is required') : z.string().optional(),
    
    eligibilityType: needCsc ? z.enum(['csc_prof', 'csc_sub', 'ra_1080', 'special_laws', 'drivers_license', 'tesda', 'others']) : jobApplicationSchema.shape.eligibilityType,
    
    educationalBackground: needEdu ? z.enum(EDUCATION_LEVELS) : jobApplicationSchema.shape.educationalBackground,
    experience: needEdu ? z.string().min(1, 'Professional experience is required') : z.string().optional(),
    skills: needEdu ? z.string().min(1, 'Relevant skills are required') : z.string().optional(),
  });
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
    requireCivilService: boolean;
    requireGovernmentIds: boolean;
    requireEducationExperience: boolean;
}

