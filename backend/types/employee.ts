import { authentication } from '../db/schema.js';
import { InferSelectModel } from 'drizzle-orm';
import { UserRole, EmploymentStatus, Gender, CivilStatus, AppointmentType } from './index.js';

export type EmployeeDbModel = InferSelectModel<typeof authentication>;

export interface EmployeeMapperInput {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  suffix?: string | null;
  email?: string | null;
  role?: string | null;
  department?: string | null;
  departmentId?: number | null;
  employeeId?: string | null;
  jobTitle?: string | null;
  positionTitle?: string | null;
  employmentStatus?: string | null;
  employmentType?: string | null;
  dateHired?: string | null;
  contractEndDate?: string | null;
  regularizationDate?: string | null;
  isRegular?: boolean | null;
  birthDate?: string | null;
  gender?: string | null;
  civilStatus?: string | null;
  nationality?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  permanentAddress?: string | null;
  avatarUrl?: string | null;
  umidNumber?: string | null;
  philsysId?: string | null;
  philhealthNumber?: string | null;
  pagibigNumber?: string | null;
  tinNumber?: string | null;
  gsisNumber?: string | null;
  educationalBackground?: string | null;
  schoolName?: string | null;
  course?: string | null;
  yearGraduated?: string | null;
  skillsText?: string | null;
  salaryGrade?: string | null;
  stepIncrement?: number | null;
  appointmentType?: string | null;
  station?: string | null;
  itemNumber?: string | null;
  positionId?: number | null;
  duties?: string | null;
  shift?: string | null;
  heightM?: string | null;
  weightKg?: string | null;
  bloodType?: string | null;
  placeOfBirth?: string | null;
  residentialAddress?: string | null;
  residentialZipCode?: string | null;
  permanentZipCode?: string | null;
  telephoneNo?: string | null;
  mobileNo?: string | null;
  agencyEmployeeNo?: string | null;
  emergencyContact?: string | null;
  emergencyContactNumber?: string | null;
  eligibilityType?: string | null;
  eligibilityNumber?: string | null;
  eligibilityDate?: string | null;
  yearsOfExperience?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  twitterHandle?: string | null;
  firstDayOfService?: string | null;
  officeAddress?: string | null;
  originalAppointmentDate?: string | null;
  lastPromotionDate?: string | null;
  religion?: string | null;
  citizenship?: string | null;
  citizenshipType?: string | null;
  resHouseBlockLot?: string | null;
  resStreet?: string | null;
  resSubdivision?: string | null;
  resBarangay?: string | null;
  resCity?: string | null;
  resProvince?: string | null;
  resRegion?: string | null;
  permHouseBlockLot?: string | null;
  permStreet?: string | null;
  permSubdivision?: string | null;
  permBarangay?: string | null;
  permCity?: string | null;
  permProvince?: string | null;
  permRegion?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  isBiometricEnrolled?: boolean | null;
  dutyType?: string | null;

  relatedThirdDegree?: string | null;
  relatedThirdDetails?: string | null;
  relatedFourthDegree?: string | null;
  relatedFourthDetails?: string | null;
  foundGuiltyAdmin?: string | null;
  foundGuiltyDetails?: string | null;
  criminallyCharged?: string | null;
  dateFiled?: string | null;
  statusOfCase?: string | null;
  convictedCrime?: string | null;
  convictedDetails?: string | null;
  separatedFromService?: string | null;
  separatedDetails?: string | null;
  electionCandidate?: string | null;
  electionDetails?: string | null;
  resignedToPromote?: string | null;
  resignedDetails?: string | null;
  immigrantStatus?: string | null;
  immigrantDetails?: string | null;
  indigenousMember?: string | null;
  indigenousDetails?: string | null;
  personWithDisability?: string | null;
  disabilityIdNo?: string | null;
  soloParent?: string | null;
  soloParentIdNo?: string | null;

  // Other PDS 2025 Fields
  dualCountry?: string | null;
  govtIdType?: string | null;
  govtIdNo?: string | null;
  govtIdIssuance?: string | null;
  isMeycauayan?: boolean | null;
  dateAccomplished?: string | null;
  pdsQuestions?: any | null;
}

/**
 * API Response Model (CamelCase for Project Consistency)
 */
export interface EmployeeApiResponse {
  id: number;
  employeeName: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  suffix: string | null;
  email: string;
  role: UserRole;
  department: string | null;
  departmentId: number | null;
  employeeId: string;
  jobTitle: string | null;
  positionTitle: string | null;
  employmentStatus: EmploymentStatus | null;
  employmentType: string | null;
  dateHired: string | null;
  contractEndDate: string | null;
  regularizationDate: string | null;
  isRegular: boolean;
  birthDate: string | null;
  gender: Gender | null;
  civilStatus: CivilStatus | null;
  nationality: string | null;
  phoneNumber: string | null;
  address: string | null;
  permanentAddress: string | null;
  avatarUrl: string | null;
  umidNumber: string | null;
  philsysId: string | null;
  philhealthNumber: string | null;
  pagibigNumber: string | null;
  tinNumber: string | null;
  gsisNumber: string | null;
  educationalBackground: string | null;
  schoolName: string | null;
  course: string | null;
  yearGraduated: string | null;
  coreCompetencies: string | null;
  salaryGrade: string | null;
  stepIncrement: number;
  appointmentType: AppointmentType | null;
  station: string | null;
  itemNumber: string | null;
  positionId: number | null;
  duties: string; // From COALESCE in SQL
  shift: string | null;
  
  // PDS / Extended Fields
  heightM: string | null;
  weightKg: string | null;
  bloodType: string | null;
  placeOfBirth: string | null;
  residentialAddress: string | null;
  residentialZipCode: string | null;
  permanentZipCode: string | null;
  telephoneNo: string | null;
  mobileNo: string | null;
  agencyEmployeeNo: string | null;
  emergencyContact: string | null;
  emergencyContactNumber: string | null;
  
  // Eligibility
  eligibilityType: string | null;
  eligibilityNumber: string | null;
  eligibilityDate: string | null;
  yearsOfExperience: number;

  // Social Media
  facebookUrl: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;

  // Additional
  firstDayOfService: string | null;
  officeAddress: string | null;
  originalAppointmentDate: string | null;
  lastPromotionDate: string | null;
  
  // New Precision Fields
  barangay: string | null;
  religion: string | null;
  citizenship: string | null;
  citizenshipType: string | null;
  resHouseBlockLot: string | null;
  resStreet: string | null;
  resSubdivision: string | null;
  resBarangay: string | null;
  resCity: string | null;
  resProvince: string | null;
  permHouseBlockLot: string | null;
  permStreet: string | null;
  permSubdivision: string | null;
  permBarangay: string | null;
  permCity: string | null;
  permProvince: string | null;
  isBiometricEnrolled: boolean;
  startTime: string | null;
  endTime: string | null;

  // Section IX: Declarations
  relatedThirdDegree: string | null;
  relatedThirdDetails: string | null;
  relatedFourthDegree: string | null;
  relatedFourthDetails: string | null;
  foundGuiltyAdmin: string | null;
  foundGuiltyDetails: string | null;
  criminallyCharged: string | null;
  dateFiled: string | null;
  statusOfCase: string | null;
  convictedCrime: string | null;
  convictedDetails: string | null;
  separatedFromService: string | null;
  separatedDetails: string | null;
  electionCandidate: string | null;
  electionDetails: string | null;
  resignedToPromote: string | null;
  resignedDetails: string | null;
  immigrantStatus: string | null;
  immigrantDetails: string | null;
  indigenousMember: string | null;
  indigenousDetails: string | null;
  personWithDisability: string | null;
  disabilityIdNo: string | null;
  soloParent: string | null;
  soloParentIdNo: string | null;

  // Other PDS 2025 Fields
  dualCountry: string | null;
  govtIdType: string | null;
  govtIdNo: string | null;
  govtIdIssuance: string | null;
  isMeycauayan: boolean;
  dutyType: string | null;
  dateAccomplished: string | null;
  pdsQuestions: any | null;
}

/**
 * Related Employee Data
 */
export interface EmployeeSkillsResponse {
  id: number;
  skillName: string;
  category: string;
  proficiencyLevel: string;
  yearsExperience: number | null;
}

export interface EmployeeEducationResponse {
  id: number;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  level?: string | null;
  yearGraduated?: string | null;
  honors?: string | null;
  unitsEarned?: string | null;
}

export interface EmployeeEmergencyContactResponse {
  id: number;
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  isPrimary: boolean;
}

export interface EmployeeCustomFieldResponse {
  id: number;
  section: string;
  fieldName: string;
  fieldValue: string | null;
}

export interface EmployeeFamilyResponse {
  id: number;
  relationType: 'Spouse' | 'Father' | 'Mother' | 'Child' | string;
  lastName: string | null;
  firstName: string | null;
  middleName: string | null;
  nameExtension: string | null;
  occupation: string | null;
  employer: string | null;
  businessAddress: string | null;
  telephoneNo: string | null;
  dateOfBirth: string | null;
}

export interface VoluntaryWorkResponse {
  id: number;
  organizationName: string;
  address: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  hoursNumber: number | null;
  position: string | null;
}

export interface LearningDevelopmentResponse {
  id: number;
  title: string;
  dateFrom: string | null;
  dateTo: string | null;
  hoursNumber: number | null;
  typeOfLd: string | null;
  conductedBy: string | null;
}

export interface WorkplaceExperienceResponse {
  id: number;
  dateFrom: string;
  dateTo: string | null;
  positionTitle: string;
  companyName: string;
  monthlySalary: string | null;
  salaryGrade: string | null;
  appointmentStatus: string | null;
  isGovernment: boolean;
}

export interface PdsOtherInfoResponse {
  id: number;
  type: 'Skill' | 'Recognition' | 'Membership' | string;
  description: string;
}

export interface PdsReferenceResponse {
  id: number;
  name: string;
  address: string | null;
  telNo: string | null;
}

export interface EmployeeEligibilityResponse {
  id: number;
  eligibilityType: string;
  rating: string | null;
  examDate: string | null;
  examPlace: string | null;
  eligibilityNumber: string | null;
  validityDate?: string | null;
}

/**
 * Consolidated Employee Detailed Response
 */
export interface EmployeeDetailedApiResponse extends EmployeeApiResponse {
  skills: EmployeeSkillsResponse[];
  education: EmployeeEducationResponse[];
  emergencyContacts: EmployeeEmergencyContactResponse[];
  customFields: EmployeeCustomFieldResponse[];
  familyBackground: EmployeeFamilyResponse[];
  voluntaryWork: VoluntaryWorkResponse[];
  learningDevelopment: LearningDevelopmentResponse[];
  workExperience: WorkplaceExperienceResponse[];
  otherInfo: PdsOtherInfoResponse[];
  references: PdsReferenceResponse[];
  eligibilities: EmployeeEligibilityResponse[];
}
