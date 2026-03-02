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
  isRegular?: number | null;
  birthDate?: string | null;
  gender?: string | null;
  civilStatus?: string | null;
  nationality?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  permanentAddress?: string | null;
  avatarUrl?: string | null;
  umidNo?: string | null;
  philsysId?: string | null;
  philhealthNumber?: string | null;
  pagibigNumber?: string | null;
  tinNumber?: string | null;
  gsisNumber?: string | null;
  educationalBackground?: string | null;
  salaryGrade?: string | null;
  stepIncrement?: number | null;
  appointmentType?: string | null;
  station?: string | null;
  itemNumber?: string | null;
  positionId?: number | null;
  duties?: string | null;
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
  highestEducation?: string | null;
  yearsOfExperience?: number | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  twitterHandle?: string | null;
  firstDayOfService?: string | null;
  supervisor?: string | null;
  officeAddress?: string | null;
  originalAppointmentDate?: string | null;
  lastPromotionDate?: string | null;
}

/**
 * API Response Model (SnakeCase as expected by Frontend)
 */
export interface EmployeeApiResponse {
  id: number;
  employee_name: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  suffix: string | null;
  email: string;
  role: UserRole;
  department: string | null;
  department_id: number | null;
  employee_id: string;
  job_title: string | null;
  position_title: string | null;
  employment_status: EmploymentStatus | null;
  employment_type: string | null;
  date_hired: string | null;
  contract_end_date: string | null;
  regularization_date: string | null;
  is_regular: number;
  birth_date: string | null;
  gender: Gender | null;
  civil_status: CivilStatus | null;
  nationality: string | null;
  phone_number: string | null;
  address: string | null;
  permanent_address: string | null;
  avatar_url: string | null;
  umid_id: string | null;
  philsys_id: string | null;
  philhealth_number: string | null;
  pagibig_number: string | null;
  tin_number: string | null;
  gsis_number: string | null;
  educational_background: string | null;
  salary_grade: string | null;
  step_increment: number;
  appointment_type: AppointmentType | null;
  station: string | null;
  item_number: string | null;
  position_id: number | null;
  duties: string; // From COALESCE in SQL
  
  // PDS / Extended Fields
  height_m: string | null;
  weight_kg: string | null;
  blood_type: string | null;
  place_of_birth: string | null;
  residential_address: string | null;
  residential_zip_code: string | null;
  permanent_zip_code: string | null;
  telephone_no: string | null;
  mobile_no: string | null;
  agency_employee_no: string | null;
  emergency_contact: string | null;
  emergency_contact_number: string | null;
  
  // Eligibility
  eligibility_type: string | null;
  eligibility_number: string | null;
  eligibility_date: string | null;
  highest_education: string | null;
  years_of_experience: number;

  // Social Media
  facebook_url: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;

  // Additional
  first_day_of_service: string | null;
  supervisor: string | null;
  office_address: string | null;
}

/**
 * Related Employee Data
 */
export interface EmployeeSkillsResponse {
  id: number;
  skill_name: string;
  category: string;
  proficiency_level: string;
  years_experience: number | null;
}

export interface EmployeeEducationResponse {
  id: number;
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: number;
}

export interface EmployeeEmergencyContactResponse {
  id: number;
  name: string;
  relationship: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  is_primary: number;
}

export interface EmployeeCustomFieldResponse {
  id: number;
  section: string;
  field_name: string;
  field_value: string | null;
}

/**
 * Consolidated Employee Detailed Response
 */
export interface EmployeeDetailedApiResponse extends EmployeeApiResponse {
  skills: EmployeeSkillsResponse[];
  education: EmployeeEducationResponse[];
  emergency_contacts: EmployeeEmergencyContactResponse[];
  custom_fields: EmployeeCustomFieldResponse[];
}
