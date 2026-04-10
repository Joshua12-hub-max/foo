import { z } from 'zod';
import { createIdValidator, ID_REGEX } from './idValidation.js';
import { PdsQuestionsSchema } from './pdsSchema.js';

export const BaseEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional().nullable(),
  suffix: z.string().optional().nullable(),
  email: z.string().email("Invalid email format"),
  
  // Job Order & Regularization Fields
  department: z.string().optional().nullable(),
  departmentId: z.number().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  duties: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  role: z.string(),
  employmentStatus: z.enum(['Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause']),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contractual', 'Job Order', 'Coterminous', 'Temporary', 'Probationary', 'Casual', 'Permanent', 'Contract of Service', 'JO', 'COS']),
  contractEndDate: z.string().optional().nullable(), // Required if Job Order
  regularizationDate: z.string().optional().nullable(), // Auto-calc or manual
  isRegular: z.boolean(),
  employeeId: z.string().regex(/^Emp-(00[1-9]|0[1-9][0-9]|1[0-9]{2}|200)$/, "Employee ID must be exactly Emp-001 to Emp-200 due to sensor capacity limits").optional().nullable(),
  password: z.string().optional().nullable(),
  positionId: z.number().optional().nullable(),
  
  // Personal Info
  birthDate: z.string().optional().nullable(),
  gender: z.enum(['Male', 'Female']).optional().nullable(),
  civilStatus: z.enum(['Single', 'Married', 'Widowed', 'Separated', 'Annulled']).optional().nullable(),
  nationality: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  barangay: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  citizenship: z.string().optional().nullable(),
  citizenshipType: z.string().optional().nullable(),
  
  // PDS Fields
  heightM: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/,/g, '').trim();
    if (cleaned === "" || cleaned.toLowerCase() === 'n/a') return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }, z.number().nullable().optional()),
  weightKg: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return null;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/,/g, '').trim();
    if (cleaned === "" || cleaned.toLowerCase() === 'n/a') return null;
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }, z.number().nullable().optional()),
  bloodType: z.string().optional().nullable(),
  placeOfBirth: z.string().optional().nullable(),
  residentialAddress: z.string().optional().nullable(),
  residentialZipCode: z.string().optional().nullable(),
  permanentZipCode: z.string().optional().nullable(),
  telephoneNo: z.string().optional().nullable(),
  mobileNo: z.string().optional().nullable(),
  agencyEmployeeNo: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyContactNumber: z.string().optional().nullable(),
  resHouseBlockLot: z.string().optional().nullable(),
  resStreet: z.string().optional().nullable(),
  resSubdivision: z.string().optional().nullable(),
  resBarangay: z.string().optional().nullable(),
  resCity: z.string().optional().nullable(),
  resProvince: z.string().optional().nullable(),
  resRegion: z.string().optional().nullable(),
  permHouseBlockLot: z.string().optional().nullable(),
  permStreet: z.string().optional().nullable(),
  permSubdivision: z.string().optional().nullable(),
  permBarangay: z.string().optional().nullable(),
  permCity: z.string().optional().nullable(),
  permProvince: z.string().optional().nullable(),
  permRegion: z.string().optional().nullable(),
  
  // Government IDs
  umidNumber: createIdValidator(ID_REGEX.UMID, "UMID Number"),
  philsysId: createIdValidator(ID_REGEX.PHILSYS, "PhilSys ID"),
  philhealthNumber: createIdValidator(ID_REGEX.PHILHEALTH, "PhilHealth Number"),
  pagibigNumber: createIdValidator(ID_REGEX.PAGIBIG, "Pag-IBIG Number"),
  tinNumber: createIdValidator(ID_REGEX.TIN, "TIN"),
  gsisNumber: createIdValidator(ID_REGEX.GSIS, "GSIS Number"),
  educationalBackground: z.string().optional().nullable(),
  schoolName: z.string().optional().nullable(),
  course: z.string().optional().nullable(),
  yearGraduated: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
  
  // Employment Details
  salaryGrade: z.coerce.string().optional().nullable(),
  stepIncrement: z.number().optional().nullable(),
  appointmentType: z.enum(['Permanent', 'Contractual', 'Casual', 'Job Order', 'Coterminous', 'Temporary', 'Contract of Service', 'JO', 'COS']).optional().nullable(),
  originalAppointmentDate: z.string().optional().nullable(),
  lastPromotionDate: z.string().optional().nullable(),
  station: z.string().optional().nullable(),
  officeAddress: z.string().optional().nullable(),
  positionTitle: z.string().optional().nullable(),
  itemNumber: z.string().optional().nullable(),
  dateHired: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  
  // Plantilla-required Eligibility Fields
  eligibilityType: z.string().optional().nullable(),
  eligibilityNumber: z.string().optional().nullable(),
  eligibilityDate: z.string().optional().nullable(),
  yearsOfExperience: z.number().optional().nullable(),
  
  // Social Media
  facebookUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  twitterHandle: z.string().optional().nullable(),
  applicantId: z.number().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  dutyType: z.enum(['Standard', 'Irregular']).optional().nullable(),

  // Section IX: Declarations
  relatedThirdDegree: z.string().optional().nullable(),
  relatedThirdDetails: z.string().optional().nullable(),
  relatedFourthDegree: z.string().optional().nullable(),
  relatedFourthDetails: z.string().optional().nullable(),
  foundGuiltyAdmin: z.string().optional().nullable(),
  foundGuiltyDetails: z.string().optional().nullable(),
  criminallyCharged: z.string().optional().nullable(),
  dateFiled: z.string().optional().nullable(),
  statusOfCase: z.string().optional().nullable(),
  convictedCrime: z.string().optional().nullable(),
  convictedDetails: z.string().optional().nullable(),
  separatedFromService: z.string().optional().nullable(),
  separatedDetails: z.string().optional().nullable(),
  electionCandidate: z.string().optional().nullable(),
  electionDetails: z.string().optional().nullable(),
  resignedToPromote: z.string().optional().nullable(),
  resignedDetails: z.string().optional().nullable(),
  immigrantStatus: z.string().optional().nullable(),
  immigrantDetails: z.string().optional().nullable(),
  indigenousMember: z.string().optional().nullable(),
  indigenousDetails: z.string().optional().nullable(),
  personWithDisability: z.string().optional().nullable(),
  disabilityIdNo: z.string().optional().nullable(),
  soloParent: z.string().optional().nullable(),
  soloParentIdNo: z.string().optional().nullable(),

  // Other PDS 2025 Fields
  dualCountry: z.string().optional().nullable(),
  govtIdType: z.string().optional().nullable(),
  govtIdNo: z.string().optional().nullable(),
  govtIdIssuance: z.string().optional().nullable(),
  isMeycauayan: z.boolean().optional().default(false),
  dateAccomplished: z.string().optional().nullable(),
  pdsQuestions: PdsQuestionsSchema.optional().nullable(),

  // Section II: Family Background (Children)
  children: z.array(z.object({
    id: z.union([z.string(), z.number()]).optional(),
    fullName: z.string(),
    dob: z.string()
  })).optional(),

  spouseSurname: z.string().optional().nullable(),
  spouseFirstName: z.string().optional().nullable(),
  spouseMiddleName: z.string().optional().nullable(),
  spouseExtension: z.string().optional().nullable(),
  spouseOccupation: z.string().optional().nullable(),
  spouseEmployer: z.string().optional().nullable(),
  spouseBusinessAddress: z.string().optional().nullable(),
  spouseTelephone: z.string().optional().nullable(),

  fatherSurname: z.string().optional().nullable(),
  fatherFirstName: z.string().optional().nullable(),
  fatherMiddleName: z.string().optional().nullable(),
  fatherExtension: z.string().optional().nullable(),

  motherSurname: z.string().optional().nullable(),
  motherFirstName: z.string().optional().nullable(),
  motherMiddleName: z.string().optional().nullable(),

  // Section III: Education
  eduElementarySchool: z.string().optional().nullable(),
  eduElementaryCourse: z.string().optional().nullable(),
  eduElementaryFrom: z.string().optional().nullable(),
  eduElementaryTo: z.string().optional().nullable(),
  eduElementaryUnits: z.string().optional().nullable(),
  eduElementaryYearGrad: z.string().optional().nullable(),
  eduElementaryHonors: z.string().optional().nullable(),

  eduSecondarySchool: z.string().optional().nullable(),
  eduSecondaryCourse: z.string().optional().nullable(),
  eduSecondaryFrom: z.string().optional().nullable(),
  eduSecondaryTo: z.string().optional().nullable(),
  eduSecondaryUnits: z.string().optional().nullable(),
  eduSecondaryYearGrad: z.string().optional().nullable(),
  eduSecondaryHonors: z.string().optional().nullable(),

  eduVocationalSchool: z.string().optional().nullable(),
  eduVocationalCourse: z.string().optional().nullable(),
  eduVocationalFrom: z.string().optional().nullable(),
  eduVocationalTo: z.string().optional().nullable(),
  eduVocationalUnits: z.string().optional().nullable(),
  eduVocationalYearGrad: z.string().optional().nullable(),
  eduVocationalHonors: z.string().optional().nullable(),

  eduCollegeSchool: z.string().optional().nullable(),
  eduCollegeCourse: z.string().optional().nullable(),
  eduCollegeFrom: z.string().optional().nullable(),
  eduCollegeTo: z.string().optional().nullable(),
  eduCollegeUnits: z.string().optional().nullable(),
  eduCollegeYearGrad: z.string().optional().nullable(),
  eduCollegeHonors: z.string().optional().nullable(),

  eduGradSchool: z.string().optional().nullable(),
  eduGradCourse: z.string().optional().nullable(),
  eduGradFrom: z.string().optional().nullable(),
  eduGradTo: z.string().optional().nullable(),
  eduGradUnits: z.string().optional().nullable(),
  eduGradYearGrad: z.string().optional().nullable(),
  eduGradHonors: z.string().optional().nullable(),

  // Section IV-VII: Arrays
  eligibilities: z.array(z.object({
    id: z.union([z.string(), z.number()]).optional(),
    name: z.string(),
    rating: z.string().optional().nullable(),
    examDate: z.string().optional().nullable(),
    examPlace: z.string().optional().nullable(),
    licenseNo: z.string().optional().nullable(),
    licenseValidUntil: z.string().optional().nullable()
  })).optional(),

  workExperiences: z.array(z.object({
    id: z.union([z.string(), z.number()]).optional(),
    positionTitle: z.string(),
    department: z.string(),
    from: z.string(),
    to: z.string().optional().nullable(),
    monthlySalary: z.string().optional().nullable(),
    salaryGrade: z.string().optional().nullable(),
    appointmentStatus: z.string().optional().nullable(),
    govtService: z.string().optional().nullable()
  })).optional(),

  voluntaryWorks: z.array(z.object({
    id: z.union([z.string(), z.number()]).optional(),
    organization: z.string(),
    from: z.string(),
    to: z.string().optional().nullable(),
    hours: z.string().optional().nullable(),
    positionNature: z.string().optional().nullable()
  })).optional(),

  trainings: z.array(z.object({
    id: z.union([z.string(), z.number()]).optional(),
    title: z.string(),
    from: z.string(),
    to: z.string().optional().nullable(),
    hours: z.string().optional().nullable(),
    ldType: z.string().optional().nullable(),
    conductedBy: z.string().optional().nullable()
  })).optional(),

  references: z.array(z.object({
    name: z.string(),
    address: z.string(),
    contact: z.string()
  })).optional(),

  specialSkills: z.string().optional().nullable(),
  nonAcademicDistinctions: z.string().optional().nullable(),
  memberships: z.string().optional().nullable(),
});

export const CreateEmployeeSchema = BaseEmployeeSchema.extend({
  role: z.string().default("employee"),
  employmentStatus: z.enum(['Active','Probationary','Terminated','Resigned','On Leave','Suspended','Verbal Warning','Written Warning','Show Cause']).default('Active'),
  employmentType: z.enum(['Full-time', 'Part-time', 'Contractual', 'Job Order', 'Coterminous', 'Temporary', 'Probationary', 'Casual', 'Permanent']).default('Probationary'),
  isRegular: z.boolean().default(false),
});

export const UpdateEmployeeSchema = BaseEmployeeSchema.partial();

export const AddSkillSchema = z.object({
  skillName: z.string().min(1, "Skill name is required"),
  category: z.string().default("Technical"),
  proficiencyLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).default("Intermediate"),
  yearsExperience: z.number().optional().nullable()
});

export const AddEducationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().optional().nullable(),
  fieldOfStudy: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isCurrent: z.boolean().default(false),
  type: z.string().default("Education"),
  description: z.string().optional().nullable()
});

export const AddContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false)
});

export const UpdateSkillSchema = AddSkillSchema.partial();
export const UpdateEducationSchema = AddEducationSchema.partial();
export const UpdateContactSchema = AddContactSchema.partial();

export const RevertStatusSchema = z.object({
    newStatus: z.string().min(1, "Status is required"),
    reason: z.string().optional()
});

export const AddCustomFieldSchema = z.object({
  section: z.string().min(1, "Section is required"),
  fieldName: z.string().min(1, "Field name is required"),
  fieldValue: z.string().optional().nullable() // Can be null/empty
});

export const UpdateCustomFieldSchema = AddCustomFieldSchema.partial();

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;

export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;

export const PDSUpdateSchema = z.object({
  items: z.array(z.object({}).passthrough()).min(0),
  employeeId: z.coerce.string().optional()
});

export type PDSUpdateInput = z.infer<typeof PDSUpdateSchema>;
