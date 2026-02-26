import { z } from 'zod';


export const jobApplicationSchema = z.object({
  job_id: z.string().or(z.number()).optional(),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  middle_name: z.string().optional(),
  suffix: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  zip_code: z.string().min(1, 'Zip code is required'),
  permanent_address: z.string().optional(),
  permanent_zip_code: z.string().optional(),
  birth_date: z.string().min(1, 'Birth date is required'),
  birth_place: z.string().min(1, 'Birth place is required'),
  sex: z.enum(['Male', 'Female']),
  civil_status: z.enum(['Single', 'Married', 'Widowed', 'Separated', 'Annulled']),
  height: z.string().or(z.number()).optional(),
  weight: z.string().or(z.number()).optional(),
  blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'none']),
  
  // Residency Format matching Registration
  is_meycauayan_resident: z.boolean(),
  resRegion: z.string().optional(),
  resProvince: z.string().optional(),
  resCity: z.string().min(1, 'City/Municipality is required'),
  resBrgy: z.string().min(1, 'Barangay is required'),
  resStreet: z.string().optional(),
  residentialZipCode: z.string().optional(),

  permRegion: z.string().optional(),
  permProvince: z.string().optional(),
  permCity: z.string().optional(),
  permBrgy: z.string().optional(),
  permStreet: z.string().optional(),
  permanentZipCode: z.string().optional(),
  // Gov IDs with masking/format hints
  gsis_no: z.string().optional(),
  pagibig_no: z.string().optional(),
  philhealth_no: z.string().optional(),
  umid_no: z.string().optional(),
  philsys_id: z.string().optional(),
  tin_no: z.string().optional(),

  // Eligibility (Refined for CSC/JO)
  eligibility: z.string().optional(),
  eligibility_type: z.enum([
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
  eligibility_date: z.string().optional(),
  eligibility_rating: z.string().optional(),
  eligibility_place: z.string().optional(),
  license_no: z.string().optional(),

  // Background
  total_experience_years: z.string().or(z.number()).optional(),
  education: z.string().optional(),
  experience: z.string().optional(),
  skills: z.string().optional(),

  // Anti-Spam
  hp_field: z.string().max(0, 'Spam detected').optional(),
  website_url: z.string().max(0, 'Spam detected').optional(),
  h_token: z.string().optional(),
  
  photo: z.instanceof(File).optional(),
  photo_preview: z.string().optional(),
  resume: z.instanceof(File).optional(),
  eligibility_cert: z.instanceof(File).optional(),
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
    gsis_no: needIds ? z.string().min(1, 'GSIS Number is required') : z.string().optional(),
    pagibig_no: needIds ? z.string().min(1, 'Pag-IBIG is required') : z.string().optional(),
    philhealth_no: needIds ? z.string().min(1, 'PhilHealth is required') : z.string().optional(),
    umid_no: needIds ? z.string().min(1, 'UMID is required') : z.string().optional(),
    philsys_id: needIds ? z.string().min(1, 'PhilSys ID is required') : z.string().optional(),
    tin_no: needIds ? z.string().min(1, 'TIN is required') : z.string().optional(),
    
    eligibility_type: needCsc ? z.enum(['csc_prof', 'csc_sub', 'ra_1080', 'special_laws', 'drivers_license', 'tesda', 'others']) : jobApplicationSchema.shape.eligibility_type,
    
    education: needEdu ? z.string().min(1, 'Academic background is required') : z.string().optional(),
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
    employment_type?: string;
    salary_range?: string;
    posted_at?: string;
    created_at?: string;
    job_description: string;
    requirements: string;
    status: string;
    require_civil_service: boolean;
    require_government_ids: boolean;
    require_education_experience: boolean;
}

