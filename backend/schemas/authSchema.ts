import { z } from 'zod';

const PdsDeclarationsSchema = z.object({
  relatedThirdDegree: z.boolean().default(false),
  relatedThirdDetails: z.string().optional().nullable(),
  relatedFourthDegree: z.boolean().default(false),
  relatedFourthDetails: z.string().optional().nullable(),
  foundGuiltyAdmin: z.boolean().default(false),
  foundGuiltyDetails: z.string().optional().nullable(),
  criminallyCharged: z.boolean().default(false),
  dateFiled: z.string().optional().nullable(),
  statusOfCase: z.string().optional().nullable(),
  convictedCrime: z.boolean().default(false),
  convictedDetails: z.string().optional().nullable(),
  separatedFromService: z.boolean().default(false),
  separatedDetails: z.string().optional().nullable(),
  electionCandidate: z.boolean().default(false),
  electionDetails: z.string().optional().nullable(),
  resignedToPromote: z.boolean().default(false),
  resignedDetails: z.string().optional().nullable(),
  immigrantStatus: z.boolean().default(false),
  immigrantDetails: z.string().optional().nullable(),
  indigenousMember: z.boolean().default(false),
  indigenousDetails: z.string().optional().nullable(),
  personWithDisability: z.boolean().default(false),
  disabilityIdNo: z.string().optional().nullable(),
  soloParent: z.boolean().default(false),
  soloParentIdNo: z.string().optional().nullable(),
  govtIdType: z.string().optional().nullable(),
  govtIdNo: z.string().optional().nullable(),
  govtIdIssuance: z.string().optional().nullable(),
  dateAccomplished: z.string().optional().nullable(),
});

const EducationSchema = z.object({
  level: z.enum(['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate Studies']),
  schoolName: z.string(),
  degreeCourse: z.string().optional().nullable(),
  dateFrom: z.string().optional().nullable(),
  dateTo: z.string().optional().nullable(),
  unitsEarned: z.string().optional().nullable(),
  yearGraduated: z.coerce.number().optional().nullable(),
  honors: z.string().optional().nullable()
});

const WorkExperienceSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string().optional().nullable(),
  positionTitle: z.string(),
  companyName: z.string(),
  monthlySalary: z.coerce.number().optional().nullable(),
  salaryGrade: z.string().optional().nullable(),
  appointmentStatus: z.string().optional().nullable(),
  isGovernment: z.boolean().default(false)
});

const EligibilitySchema = z.object({
  eligibilityName: z.string(),
  rating: z.coerce.number().optional().nullable(),
  examDate: z.string().optional().nullable(),
  examPlace: z.string().optional().nullable(),
  licenseNumber: z.string().optional().nullable(),
  validityDate: z.string().optional().nullable()
});

const LearningDevelopmentSchema = z.object({
  title: z.string(),
  dateFrom: z.string().optional().nullable(),
  dateTo: z.string().optional().nullable(),
  hoursNumber: z.coerce.number().optional().nullable(),
  typeOfLd: z.string().optional().nullable(),
  conductedBy: z.string().optional().nullable()
});

const VoluntaryWorkSchema = z.object({
  organizationName: z.string(),
  address: z.string().optional().nullable(),
  dateFrom: z.string().optional().nullable(),
  dateTo: z.string().optional().nullable(),
  hoursNumber: z.coerce.number().optional().nullable(),
  position: z.string().optional().nullable()
});

const ReferenceSchema = z.object({
  name: z.string(),
  address: z.string().optional().nullable(),
  telNo: z.string().optional().nullable()
});

const FamilySchema = z.object({
  relationType: z.enum(['Spouse', 'Father', 'Mother', 'Child']),
  lastName: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  middleName: z.string().optional().nullable(),
  nameExtension: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  employer: z.string().optional().nullable(),
  businessAddress: z.string().optional().nullable(),
  telephoneNo: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable()
});

const OtherInfoSchema = z.object({
  type: z.enum(['Skill', 'Recognition', 'Membership']),
  description: z.string()
});

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or Employee ID is required"),
  password: z.string().min(1, "Password is required")
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const ResetPasswordSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const VerifyOTPSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  otp: z.string().length(6, "OTP must be exactly 6 digits")
});

export const EmailVerifySchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be exactly 6 digits")
});

export const ResendOTPSchema = z.object({
  identifier: z.string().min(1, "Identifier is required")
});

export const RegisterSchema = z.object({
  // Required Authentication / Contact Fields
  email: z.string().email(),
  password: z.string().optional().nullable(),
  role: z.string().default('user'),
  
  // Basic Names (Authentication table)
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional().nullable(),
  suffix: z.string().optional().nullable(),
  employeeId: z.string().optional().nullable(),

  // PDS Personal Information
  birthDate: z.string().optional().nullable(),
  placeOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  civilStatus: z.string().optional().nullable(),
  heightM: z.coerce.number().optional().nullable(),
  weightKg: z.coerce.number().optional().nullable(),
  bloodType: z.string().optional().nullable(),
  citizenship: z.string().optional().nullable(),
  citizenshipType: z.string().optional().nullable(),
  dualCountry: z.string().optional().nullable(),
  telephoneNo: z.string().optional().nullable(),
  mobileNo: z.string().optional().nullable(),

  // Ids
  gsisNumber: z.string().optional().nullable(),
  pagibigNumber: z.string().optional().nullable(),
  philhealthNumber: z.string().optional().nullable(),
  tinNumber: z.string().optional().nullable(),
  umidNumber: z.string().optional().nullable(),
  philsysId: z.string().optional().nullable(),
  agencyEmployeeNo: z.string().optional().nullable(),

  // Decomposed Residential Address
  resHouseBlockLot: z.string().optional().nullable(),
  resStreet: z.string().optional().nullable(),
  resSubdivision: z.string().optional().nullable(),
  resBarangay: z.string().optional().nullable(),
  resCity: z.string().optional().nullable(),
  resProvince: z.string().optional().nullable(),
  resRegion: z.string().optional().nullable(),
  residentialZipCode: z.string().optional().nullable(),

  // Decomposed Permanent Address
  permHouseBlockLot: z.string().optional().nullable(),
  permStreet: z.string().optional().nullable(),
  permSubdivision: z.string().optional().nullable(),
  permBarangay: z.string().optional().nullable(),
  permCity: z.string().optional().nullable(),
  permProvince: z.string().optional().nullable(),
  permRegion: z.string().optional().nullable(),
  permanentZipCode: z.string().optional().nullable(),

  // Arrays
  educations: z.array(EducationSchema).optional().default([]),
  eligibilities: z.array(EligibilitySchema).optional().default([]),
  workExperiences: z.array(WorkExperienceSchema).optional().default([]),
  learningDevelopments: z.array(LearningDevelopmentSchema).optional().default([]),
  voluntaryWorks: z.array(VoluntaryWorkSchema).optional().default([]),
  references: z.array(ReferenceSchema).optional().default([]),
  familyBackground: z.array(FamilySchema).optional().default([]),
  otherInfo: z.array(OtherInfoSchema).optional().default([]),

  declarations: PdsDeclarationsSchema.optional().nullable(),

  // Additional fields for admin registration and applicant conversion
  applicantId: z.union([z.string(), z.number()]).optional().nullable(),
  applicantPhotoPath: z.string().optional().nullable(),
  applicantHiredDate: z.string().optional().nullable(),
  ignoreDuplicateWarning: z.union([z.string(), z.boolean()]).optional(),
  isOldEmployee: z.union([z.string(), z.boolean()]).optional(),
  isMeycauayan: z.union([z.string(), z.boolean()]).optional(),
  dutyType: z.string().optional().nullable(),
  appointmentType: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  experience: z.string().optional().nullable(),

  // Legacy fields (removed from schema but kept for backward compatibility)
  religion: z.string().optional().nullable(),
  facebookUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  twitterHandle: z.string().optional().nullable(),

  // Field aliases for backward compatibility with different naming conventions
  surname: z.string().optional().nullable(), // alias for lastName
  nameExtension: z.string().optional().nullable(), // alias for suffix
  maidenName: z.string().optional().nullable(),
  dob: z.string().optional().nullable(), // alias for birthDate
  pob: z.string().optional().nullable(), // alias for placeOfBirth
  sex: z.string().optional().nullable(), // alias for gender
  height: z.union([z.string(), z.number()]).optional().nullable(), // alias for heightM
  weight: z.union([z.string(), z.number()]).optional().nullable(), // alias for weightKg
  nationality: z.string().optional().nullable(), // alias for citizenship
  address: z.string().optional().nullable(),
  residentialAddress: z.string().optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  gsisNo: z.string().optional().nullable(), // alias for gsisNumber
  pagibigNo: z.string().optional().nullable(), // alias for pagibigNumber
  philhealthNo: z.string().optional().nullable(), // alias for philhealthNumber
  tinNo: z.string().optional().nullable(), // alias for tinNumber
  umidNo: z.string().optional().nullable(), // alias for umidNumber
  philsysNo: z.string().optional().nullable(), // alias for philsysId
  agencyNo: z.string().optional().nullable(), // alias for agencyEmployeeNo

  // Additional PDS-related fields
  trainings: z.array(z.any()).optional().default([]),
  pdsQuestions: z.any().optional().nullable(),
  govtIdType: z.string().optional().nullable(),
  govtIdNo: z.string().optional().nullable(),
  govtIdIssuance: z.string().optional().nullable(),
  dateAccomplished: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyContactNumber: z.string().optional().nullable(),
});

export const UpdateProfileSchema = RegisterSchema.partial().extend({
  // HR Details fields updateable via profile update but not in base RegisterSchema
  positionTitle: z.string().optional().nullable(),
  itemNumber: z.union([z.string(), z.number()]).optional().nullable(),
  salaryGrade: z.union([z.string(), z.number()]).optional().nullable(),
  stepIncrement: z.union([z.string(), z.number()]).optional().nullable(),
  employmentStatus: z.string().optional().nullable(),
  station: z.string().optional().nullable(),
  officeAddress: z.string().optional().nullable(),
  originalAppointmentDate: z.string().optional().nullable(),
  lastPromotionDate: z.string().optional().nullable(),
  facebookUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  twitterHandle: z.string().optional().nullable(),
  isMeycauayan: z.boolean().optional(),
  religion: z.string().optional().nullable(),
  dutyType: z.string().optional().nullable(),
  appointmentType: z.string().optional().nullable(),
  dateHired: z.string().optional().nullable(),
  // Legacy bridge fields (deprecated — kept for backwards compat with old clients)
  education: z.record(z.string(), z.any()).optional(),
  eligibilityType: z.string().optional().nullable(),
  eligibilityNumber: z.string().optional().nullable(),
  eligibilityDate: z.string().optional().nullable(),
});

export const SetupPortalSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  suffix: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
  departmentId: z.coerce.number().optional(),
  positionId: z.coerce.number().optional(),
  role: z.string().optional(),
  dutyType: z.string().optional(),
  appointmentType: z.string().optional(),
});

export const GoogleLoginSchema = z.object({
  credential: z.string().min(1, "Google credential is required")
});
