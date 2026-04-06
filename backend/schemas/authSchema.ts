import { z } from 'zod';
import { PdsQuestionsSchema } from './pdsSchema.js';

const EducationSchema = z.object({
  level: z.string().optional().nullable(),
  schoolName: z.string().optional().nullable(),
  degreeCourse: z.string().optional().nullable(),
  course: z.string().optional().nullable(), 
  degree: z.string().optional().nullable(), 
  dateFrom: z.union([z.string(), z.number()]).optional().nullable(),
  startDate: z.union([z.string(), z.number()]).optional().nullable(),
  dateTo: z.union([z.string(), z.number()]).optional().nullable(),
  endDate: z.union([z.string(), z.number()]).optional().nullable(),
  unitsEarned: z.string().optional().nullable(),
  highestLevel: z.string().optional().nullable(),
  yearGraduated: z.union([z.string(), z.number()]).optional().nullable(),
  honors: z.string().optional().nullable(),
  scholarships: z.string().optional().nullable()
}).catchall(z.any());

const WorkExperienceSchema = z.object({
  dateFrom: z.string().optional().nullable(),
  fromDate: z.string().optional().nullable(),
  dateTo: z.string().optional().nullable(),
  toDate: z.string().optional().nullable(),
  positionTitle: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  monthlySalary: z.union([z.string(), z.number()]).optional().nullable(),
  salaryGrade: z.string().optional().nullable(),
  appointmentStatus: z.string().optional().nullable(),
  isGovernment: z.union([z.boolean(), z.string()]).optional().default(false).transform(v => v === true || String(v).toLowerCase() === 'yes' || String(v) === 'true')
}).catchall(z.any());

const EligibilitySchema = z.object({
  eligibilityName: z.string().optional().nullable().or(z.literal("")),
  rating: z.union([z.string(), z.number()]).optional().nullable(),
  examDate: z.string().optional().nullable(),
  examPlace: z.string().optional().nullable(),
  licenseNumber: z.string().optional().nullable(),
  validityDate: z.string().optional().nullable()
}).catchall(z.any());

const TrainingSchema = z.object({
  title: z.string().optional().nullable(),
  trainingTitle: z.string().optional().nullable(),
  dateFrom: z.string().optional().nullable(),
  fromDate: z.string().optional().nullable(),
  dateTo: z.string().optional().nullable(),
  toDate: z.string().optional().nullable(),
  hoursNumber: z.union([z.string(), z.number()]).optional().nullable(),
  hoursCount: z.union([z.string(), z.number()]).optional().nullable(),
  typeOfLd: z.string().optional().nullable(),
  trainingType: z.string().optional().nullable(),
  conductedBy: z.string().optional().nullable()
}).catchall(z.any());

const VoluntaryWorkSchema = z.object({
  organizationName: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  dateFrom: z.string().optional().nullable(),
  fromDate: z.string().optional().nullable(),
  dateTo: z.string().optional().nullable(),
  toDate: z.string().optional().nullable(),
  hoursNumber: z.union([z.string(), z.number()]).optional().nullable(),
  position: z.string().optional().nullable(),
  natureOfWork: z.string().optional().nullable()
}).catchall(z.any());

const ReferenceSchema = z.object({
  name: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  telNo: z.string().optional().nullable(),
  telephoneNo: z.string().optional().nullable()
}).catchall(z.any());

const FamilySchema = z.object({
  relationType: z.enum(['Spouse', 'Father', 'Mother', 'Child']),
  lastName: z.string().optional().nullable(),
  surname: z.string().optional().nullable(),
  firstName: z.string().optional().nullable(),
  middleName: z.string().optional().nullable(),
  nameExtension: z.string().optional().nullable(),
  extension: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  employer: z.string().optional().nullable(),
  businessAddress: z.string().optional().nullable(),
  telephoneNo: z.string().optional().nullable(),
  mobileNo: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  dob: z.string().optional().nullable()
}).catchall(z.any());

const OtherInfoSchema = z.object({
  type: z.union([z.enum(['Skill', 'Recognition', 'Membership']), z.string()]).optional().nullable(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  details: z.string().optional().nullable()
}).catchall(z.any());

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Email or Employee ID is required"),
  password: z.string().min(1, "Password is required")
});

export const RegisterSchema = z.object({  
  employeeId: z.string().optional(),
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  surname: z.string().optional().nullable(),
  middleName: z.string().optional().nullable(),
  maidenName: z.string().optional().nullable(),
  suffix: z.string().optional().nullable(),
  nameExtension: z.string().optional().nullable(),
  
  address: z.string().optional().nullable(),
  isMeycauayan: z.union([z.boolean(), z.string()]).optional().default('false').transform((val) => val === true || val === 'true'), 
  barangay: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
  role: z.string().optional().nullable().or(z.literal("")),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  dutyType: z.string().optional().nullable().or(z.literal("")),
  appointmentType: z.string().optional().nullable().or(z.literal("")),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  dateHired: z.string().optional().nullable(),

  birthDate: z.string().optional().or(z.null()).or(z.literal("")),
  dob: z.string().optional().or(z.null()).or(z.literal("")),
  placeOfBirth: z.string().optional().or(z.null()).or(z.literal("")),
  pob: z.string().optional().or(z.null()).or(z.literal("")),
  gender: z.string().optional().or(z.null()).or(z.literal("")),
  sex: z.string().optional().or(z.null()).or(z.literal("")),
  civilStatus: z.string().optional().or(z.null()).or(z.literal("")),
  religion: z.string().optional().or(z.null()).or(z.literal("")),
  nationality: z.string().optional().or(z.null()).or(z.literal("")),
  citizenship: z.string().optional().or(z.null()).or(z.literal("")),
  citizenshipType: z.string().optional().or(z.null()).or(z.literal("")),
  dualCountry: z.string().optional().or(z.null()).or(z.literal("")),
  bloodType: z.string().optional().or(z.null()).or(z.literal("")),
  heightM: z.union([z.string(), z.number()]).optional().or(z.null()).or(z.literal("")),
  height: z.union([z.string(), z.number()]).optional().or(z.null()).or(z.literal("")),
  weightKg: z.union([z.string(), z.number()]).optional().or(z.null()).or(z.literal("")),
  weight: z.union([z.string(), z.number()]).optional().or(z.null()).or(z.literal("")),

  residentialAddress: z.string().optional().or(z.null()),
  residentialZipCode: z.string().optional().or(z.null()),
  permanentAddress: z.string().optional().or(z.null()),
  permanentZipCode: z.string().optional().or(z.null()),

  resHouseBlockLot: z.string().optional().or(z.null()),
  resStreet: z.string().optional().or(z.null()),
  resSubdivision: z.string().optional().or(z.null()),
  resBarangay: z.string().optional().or(z.null()),
  resCity: z.string().optional().or(z.null()),
  resProvince: z.string().optional().or(z.null()),
  resRegion: z.string().optional().or(z.null()),

  permHouseBlockLot: z.string().optional().or(z.null()),
  permStreet: z.string().optional().or(z.null()),
  permSubdivision: z.string().optional().or(z.null()),
  permBarangay: z.string().optional().or(z.null()),
  permCity: z.string().optional().or(z.null()),
  permProvince: z.string().optional().or(z.null()),
  permRegion: z.string().optional().or(z.null()),

  telephoneNo: z.string().optional().nullable(),
  mobileNo: z.string().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  emergencyContactNumber: z.string().optional().nullable(),

  gsisNumber: z.string().optional().or(z.null()).or(z.literal('')),
  gsisNo: z.string().optional().or(z.null()).or(z.literal('')),
  pagibigNumber: z.string().optional().or(z.null()).or(z.literal('')),
  pagibigNo: z.string().optional().or(z.null()).or(z.literal('')),
  philhealthNumber: z.string().optional().or(z.null()).or(z.literal('')),
  philhealthNo: z.string().optional().or(z.null()).or(z.literal('')),
  umidNumber: z.string().optional().or(z.null()).or(z.literal('')),
  umidNo: z.string().optional().or(z.null()).or(z.literal('')),
  philsysId: z.string().optional().or(z.null()).or(z.literal('')),
  tinNumber: z.string().optional().or(z.null()).or(z.literal('')),
  tinNo: z.string().optional().or(z.null()).or(z.literal('')),
  agencyEmployeeNo: z.string().optional().or(z.null()).or(z.literal('')),

  educationalBackground: z.string().optional().or(z.null()).or(z.literal("")),
  schoolName: z.string().optional().or(z.null()).or(z.literal("")),
  course: z.string().optional().or(z.null()).or(z.literal("")),
  yearGraduated: z.string().optional().or(z.null()).or(z.literal("")),

  educations: z.array(EducationSchema).optional().default([]),
  eligibilities: z.array(EligibilitySchema).optional().default([]),
  workExperiences: z.array(WorkExperienceSchema).optional().default([]),
  trainings: z.array(TrainingSchema).optional().default([]),
  otherInfo: z.array(OtherInfoSchema).optional().default([]),
  familyBackground: z.array(FamilySchema).optional().default([]),
  voluntaryWorks: z.array(VoluntaryWorkSchema).optional().default([]),
  references: z.array(ReferenceSchema).optional().default([]),
  pdsQuestions: PdsQuestionsSchema.optional().nullable(),
  experience: z.string().optional().or(z.null()).or(z.literal("")),

  facebookUrl: z.string().optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().optional().nullable().or(z.literal('')),
  twitterHandle: z.string().optional().nullable().or(z.literal('')),
  ignoreDuplicateWarning: z.boolean().optional().default(false),

  govtIdType: z.string().optional().or(z.null()),
  govtIdNo: z.string().optional().or(z.null()),
  govtIdIssuance: z.string().optional().or(z.null()),

  applicantId: z.union([z.number(), z.string().transform(v => parseInt(v, 10))]).optional(),
  applicantHiredDate: z.string().optional(),
  applicantStartDate: z.string().optional(),
  applicantPhotoPath: z.string().optional(),
  dateAccomplished: z.string().optional().or(z.null()).or(z.literal("")),
  isOldEmployee: z.boolean().optional().default(false),
  certifiedCorrect: z.boolean().optional().default(false),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

export const ResetPasswordSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const UpdateProfileSchema = RegisterSchema.partial().extend({
  // Controller-specific simplified/legacy fields
  education: z.record(z.string(), z.object({
    school: z.string().optional().nullable(),
    course: z.string().optional().nullable(),
    yearGrad: z.union([z.string(), z.number()]).optional().nullable(),
    units: z.string().optional().nullable(),
    from: z.union([z.string(), z.number()]).optional().nullable(),
    to: z.union([z.string(), z.number()]).optional().nullable(),
    honors: z.string().optional().nullable(),
  })).optional(),
  eligibilityType: z.string().optional().nullable(),
  eligibilityNumber: z.string().optional().nullable(),
  eligibilityDate: z.string().optional().nullable(),

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
