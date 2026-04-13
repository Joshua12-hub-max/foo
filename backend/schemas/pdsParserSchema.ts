/**
 * Zod Validation Schemas for PDS Parser Output
 *
 * These schemas validate the parsed PDS data AFTER transformation.
 * All dates must be in ISO format (YYYY-MM-DD).
 * This is the final validation step before returning data to the caller.
 */

import { z } from 'zod';

// ISO date format validator: YYYY-MM-DD
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in ISO format (YYYY-MM-DD)')
  .nullable()
  .optional();

// Email validator
const emailSchema = z.string().email().nullable().optional();

// Personal Information Schema
export const PdsPersonalInfoSchema = z.object({
  birthDate: isoDateSchema,
  placeOfBirth: z.string().nullable().optional(),
  gender: z.enum(['Male', 'Female']).nullable().optional(),
  civilStatus: z
    .enum(['Single', 'Married', 'Widowed', 'Separated', 'Other/s'])
    .nullable()
    .optional(),
  heightM: z.number().positive().nullable().optional(),
  weightKg: z.number().positive().nullable().optional(),
  bloodType: z.string().nullable().optional(),
  citizenship: z
    .enum(['Filipino', 'Dual Citizenship'])
    .nullable()
    .optional(),
  citizenshipType: z
    .enum(['by birth', 'by naturalization'])
    .nullable()
    .optional(),
  dualCountry: z.string().nullable().optional(),
  telephoneNo: z.string().nullable().optional(),
  mobileNo: z.string().nullable().optional(),
  gsisNumber: z.string().nullable().optional(),
  pagibigNumber: z.string().nullable().optional(),
  philhealthNumber: z.string().nullable().optional(),
  tinNumber: z.string().nullable().optional(),
  umidNumber: z.string().nullable().optional(),
  philsysId: z.string().nullable().optional(),
  agencyEmployeeNo: z.string().nullable().optional(),
  resHouseBlockLot: z.string().nullable().optional(),
  resStreet: z.string().nullable().optional(),
  resSubdivision: z.string().nullable().optional(),
  resBarangay: z.string().nullable().optional(),
  resCity: z.string().nullable().optional(),
  resProvince: z.string().nullable().optional(),
  resRegion: z.string().nullable().optional(),
  residentialZipCode: z.string().nullable().optional(),
  permHouseBlockLot: z.string().nullable().optional(),
  permStreet: z.string().nullable().optional(),
  permSubdivision: z.string().nullable().optional(),
  permBarangay: z.string().nullable().optional(),
  permCity: z.string().nullable().optional(),
  permProvince: z.string().nullable().optional(),
  permRegion: z.string().nullable().optional(),
  permanentZipCode: z.string().nullable().optional(),
  emergencyContact: z.string().nullable().optional(),
  emergencyContactNumber: z.string().nullable().optional(),
});

// Family Background Schema
export const PdsFamilySchema = z.object({
  relationType: z.enum(['Spouse', 'Father', 'Mother', 'Child']),
  lastName: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  middleName: z.string().nullable().optional(),
  nameExtension: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  employer: z.string().nullable().optional(),
  businessAddress: z.string().nullable().optional(),
  telephoneNo: z.string().nullable().optional(),
  dateOfBirth: isoDateSchema,
});

// Education Schema
export const PdsEducationSchema = z.object({
  level: z.enum([
    'Elementary',
    'Secondary',
    'Vocational',
    'College',
    'Graduate Studies',
  ]),
  schoolName: z.string(),
  degreeCourse: z.string().nullable().optional(),
  dateFrom: z.string().nullable().optional(),
  dateTo: z.string().nullable().optional(),
  unitsEarned: z.string().nullable().optional(),
  yearGraduated: z.number().int().positive().nullable().optional(),
  honors: z.string().nullable().optional(),
});

// Eligibility Schema
export const PdsEligibilitySchema = z.object({
  eligibilityName: z.string(),
  rating: z.number().nullable().optional(),
  examDate: isoDateSchema,
  examPlace: z.string().nullable().optional(),
  licenseNumber: z.string().nullable().optional(),
  validityDate: isoDateSchema,
});

// Work Experience Schema
export const PdsWorkExperienceSchema = z.object({
  dateFrom: z.string(), // Can be ISO date or "Present"
  dateTo: z.string().nullable().optional(), // Can be ISO date, "Present", or null
  positionTitle: z.string(),
  companyName: z.string(),
  monthlySalary: z.number().nullable().optional(),
  salaryGrade: z.string().nullable().optional(),
  appointmentStatus: z.string().nullable().optional(),
  isGovernment: z.boolean(),
});

// Voluntary Work Schema
export const PdsVoluntaryWorkSchema = z.object({
  organizationName: z.string(),
  address: z.string().nullable().optional(),
  dateFrom: isoDateSchema,
  dateTo: isoDateSchema,
  hoursNumber: z.number().int().positive().nullable().optional(),
  position: z.string().nullable().optional(),
});

// Learning and Development Schema
export const PdsLearningDevelopmentSchema = z.object({
  title: z.string(),
  dateFrom: isoDateSchema,
  dateTo: isoDateSchema,
  hoursNumber: z.number().int().positive().nullable().optional(),
  typeOfLd: z.string().nullable().optional(),
  conductedBy: z.string().nullable().optional(),
});

// Other Information Schema
export const PdsOtherInfoSchema = z.object({
  type: z.enum(['Skill', 'Recognition', 'Membership']),
  description: z.string(),
});

// References Schema
export const PdsReferenceSchema = z.object({
  name: z.string(),
  address: z.string().nullable().optional(),
  telNo: z.string().nullable().optional(),
});

// Declarations Schema (currently not parsed, but defined for future use)
export const PdsDeclarationsSchema = z.object({
  relatedThirdDegree: z.boolean().nullable().optional(),
  relatedThirdDetails: z.string().nullable().optional(),
  relatedFourthDegree: z.boolean().nullable().optional(),
  relatedFourthDetails: z.string().nullable().optional(),
  foundGuiltyAdmin: z.boolean().nullable().optional(),
  foundGuiltyDetails: z.string().nullable().optional(),
  criminallyCharged: z.boolean().nullable().optional(),
  dateFiled: isoDateSchema,
  statusOfCase: z.string().nullable().optional(),
  convictedCrime: z.boolean().nullable().optional(),
  convictedDetails: z.string().nullable().optional(),
  separatedFromService: z.boolean().nullable().optional(),
  separatedDetails: z.string().nullable().optional(),
  electionCandidate: z.boolean().nullable().optional(),
  electionDetails: z.string().nullable().optional(),
  resignedToPromote: z.boolean().nullable().optional(),
  resignedDetails: z.string().nullable().optional(),
  immigrantStatus: z.boolean().nullable().optional(),
  immigrantDetails: z.string().nullable().optional(),
  indigenousMember: z.boolean().nullable().optional(),
  indigenousDetails: z.string().nullable().optional(),
  personWithDisability: z.boolean().nullable().optional(),
  disabilityIdNo: z.string().nullable().optional(),
  soloParent: z.boolean().nullable().optional(),
  soloParentIdNo: z.string().nullable().optional(),
  govtIdType: z.string().nullable().optional(),
  govtIdNo: z.string().nullable().optional(),
  govtIdIssuance: z.string().nullable().optional(),
  dateAccomplished: isoDateSchema,
});

// Main PDS Parser Output Schema
export const PdsParserOutputSchema = z.object({
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  middleName: z.string().nullable().optional(),
  email: emailSchema,
  personal: PdsPersonalInfoSchema,
  familyBackground: z.array(PdsFamilySchema),
  educations: z.array(PdsEducationSchema),
  eligibilities: z.array(PdsEligibilitySchema),
  workExperiences: z.array(PdsWorkExperienceSchema),
  voluntaryWorks: z.array(PdsVoluntaryWorkSchema),
  learningDevelopments: z.array(PdsLearningDevelopmentSchema),
  otherInfo: z.array(PdsOtherInfoSchema),
  references: z.array(PdsReferenceSchema),
  declarations: PdsDeclarationsSchema.partial().nullable().optional(),
});

// Validated output type
export type ValidatedPdsParserOutput = z.infer<typeof PdsParserOutputSchema>;
