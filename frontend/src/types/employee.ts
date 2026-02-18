import { UserRole, EmploymentStatus, Gender, CivilStatus, AppointmentType } from './enums';

/**
 * Base Employee interface mirroring the backend's EmployeeApiResponse
 * Uses snake_case to match API output.
 */
export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  middle_name: string | null;
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
  sss_number: string | null;
  philhealth_number: string | null;
  pagibig_number: string | null;
  tin_number: string | null;
  gsis_number: string | null;
  salary_grade: string | null;
  step_increment: number;
  appointment_type: AppointmentType | null;
  station: string | null;
  item_number: string | null;
  position_id: number | null;
  duties: string;

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
}

export interface Skill {
  id: number;
  skill_name: string;
  category: string;
  proficiency_level: string;
  years_experience: number | null;
}

export interface Education {
  id: number;
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: number;
  type?: string | null;
}

export interface EmergencyContact {
  id: number;
  name: string;
  relationship: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  is_primary: number;
}

export interface CustomField {
  id: number;
  section: string;
  field_name: string;
  field_value: string | null;
}

/**
 * Detailed Employee profile with related data
 */
export interface EmployeeDetailed extends Employee {
  skills: Skill[];
  education: Education[];
  emergency_contacts: EmergencyContact[];
  custom_fields: CustomField[];
}
