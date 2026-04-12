import { authentication } from '../db/schema.js';
import { InferSelectModel } from 'drizzle-orm';
import { UserRole, EmploymentStatus, AppointmentType } from './index.js';

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
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  twitterHandle?: string | null;
  firstDayOfService?: string | null;
  officeAddress?: string | null;
  originalAppointmentDate?: string | null;
  lastPromotionDate?: string | null;
  religion?: string | null;
  barangay?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  isBiometricEnrolled?: boolean | null;
  dutyType?: string | null;
  isMeycauayan?: boolean | null;
  avatarUrl?: string | null;
  salaryGrade?: string | null;
  stepIncrement?: number | null;
  appointmentType?: string | null;
  station?: string | null;
  positionId?: number | null;
  itemNumber?: string | null;
  duties?: string | null;
  shift?: string | null;
  
  // PDS Fields
  birthDate?: string | null;
  placeOfBirth?: string | null;
  gender?: string | null;
  civilStatus?: string | null;
  heightM?: string | number | null;
  weightKg?: string | number | null;
  bloodType?: string | null;
  citizenship?: string | null;
  residentialAddress?: string | null;
  permanentAddress?: string | null;
  mobileNo?: string | null;
  telephoneNo?: string | null;
  umidNumber?: string | null;
  philsysId?: string | null;
  philhealthNumber?: string | null;
  pagibigNumber?: string | null;
  tinNumber?: string | null;
  gsisNumber?: string | null;
  agencyEmployeeNo?: string | null;
  emergencyContact?: string | null;
  emergencyContactNumber?: string | null;
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
  residentialZipCode?: string | null;
  permanentZipCode?: string | null;
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
  avatarUrl: string | null;
  salaryGrade: string | null;
  stepIncrement: number;
  appointmentType: AppointmentType | null;
  station: string | null;
  itemNumber: string | null;
  positionId: number | null;
  duties: string; 
  shift: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
  firstDayOfService: string | null;
  officeAddress: string | null;
  originalAppointmentDate: string | null;
  lastPromotionDate: string | null;
  religion: string | null;
  isBiometricEnrolled: boolean;
  startTime: string | null;
  endTime: string | null;
  isMeycauayan: boolean;
  dutyType: string | null;

  // PDS Fields in Response
  birthDate: string | null;
  placeOfBirth: string | null;
  gender: string | null;
  civilStatus: string | null;
  heightM: number | null;
  weightKg: number | null;
  bloodType: string | null;
  citizenship: string | null;
  residentialAddress: string | null;
  permanentAddress: string | null;
  mobileNo: string | null;
  telephoneNo: string | null;
  umidNumber: string | null;
  philsysId: string | null;
  philhealthNumber: string | null;
  pagibigNumber: string | null;
  tinNumber: string | null;
  gsisNumber: string | null;
  agencyEmployeeNo: string | null;
  emergencyContact: string | null;
  emergencyContactNumber: string | null;
  resHouseBlockLot: string | null;
  resStreet: string | null;
  resSubdivision: string | null;
  resBarangay: string | null;
  resCity: string | null;
  resProvince: string | null;
  resRegion: string | null;
  residentialZipCode: string | null;
  permHouseBlockLot: string | null;
  permStreet: string | null;
  permSubdivision: string | null;
  permBarangay: string | null;
  permCity: string | null;
  permProvince: string | null;
  permRegion: string | null;
  permanentZipCode: string | null;
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
  schoolName: string; // Alias for PDS compatibility
  institution: string;
  degree: string | null;
  degreeCourse: string | null; // Alias for PDS compatibility
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
  position: string; // Alias for PDS compatibility
  companyName: string;
  company: string; // Alias for PDS compatibility
  monthlySalary: string | null;
  salary: string | null; // Alias for PDS compatibility
  salaryGrade: string | null;
  appointmentStatus: string | null;
  status: string | null; // Alias for PDS compatibility
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

export interface PdsDeclarationsResponse {
  id: number;
  employeeId: number;
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
  govtIdType?: string | null;
  govtIdNo?: string | null;
  govtIdIssuance?: string | null;
  dateAccomplished?: string | null;
}

export interface EmployeeEligibilityResponse {
  id: number;
  eligibilityName: string; // Alias for PDS compatibility
  name: string; // Alias for frontend compatibility
  eligibilityType: string;
  rating: string | null;
  examDate: string | null;
  examPlace: string | null;
  licenseNumber: string | null;
  eligibilityNumber: string | null; // Alias for frontend compatibility
  licenseNo: string | null; // Alias for frontend compatibility
  validityDate?: string | null;
  licenseValidUntil?: string | null; // Alias for frontend compatibility
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
  declarations: PdsDeclarationsResponse | null;
}
