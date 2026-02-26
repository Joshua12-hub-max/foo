import { UserRole, EmploymentStatus } from './enums';
export * from './enums';
export * from './employee';
export * from './org';
export * from './attendance';
export * from './recruitment';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  department?: string | null;
  employeeId: string;
  employee_id?: string; // For compatibility
  avatarUrl?: string | null;
  avatar_url?: string | null; // For compatibility
  jobTitle?: string | null;
  employmentStatus?: EmploymentStatus | null;
  employment_status?: EmploymentStatus | null; // For compatibility
  twoFactorEnabled: boolean;
  duties: string;
  status?: string;
  completion_status?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

// Shared Outlet Context for React Router
export interface OutletContext {
  sidebarOpen: boolean;
}

// Shared Date Range
export interface DateRange {
  from: string;
  to: string;
}

// Shared Pagination Interface
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  currentData?: unknown[];
  prevPage: () => void;
  nextPage: () => void;
  handlePageChange: (page: number) => void;
  setCurrentPage?: (page: number) => void;
}

// Redundant Employee interface removed.

// Attendance Header
export interface AttendanceHeader {
  key: string;
  label: string;
  sortable?: boolean;
}

// Biometrics Log (Merged DTR & Raw)
export interface BiometricsLog {
  id: string | number;
  employee_id: string | number;
  employeeId?: string; // Standardized ID
  // Raw fields
  scan_time?: string;
  type?: 'IN' | 'OUT';
  source: string;
  // DTR fields
  date?: string;
  timeIn?: string;
  timeOut?: string;
  // Common
  first_name?: string;
  last_name?: string;
  name?: string;
  department?: string;
  duties?: string;
  status?: string;
  scan_date?: Date; // Frontend helper for sorting/filtering
}

export interface MonitorLogData {
  id: number;
  employeeId: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  status: string;
  updatedAt: string;
  firstName: string;
  lastName: string;
  name: string;
  department: string;
  duties?: string;
}

// Attendance Record (General)
export interface AttendanceRecord {
  id: string | number;
  employee_id?: string | number;
  employeeId?: string; // Standardized ID
  employee_name?: string;
  name?: string; 
  date: string;
  timeIn?: string;
  timeOut?: string;
  lateMinutes?: number;
  undertimeMinutes?: number;
  status?: string;
  department?: string;
  duties?: string;
}

// New Event for Calendar
export interface NewEvent {
  title: string;
  time: string | number;
  date: string;
  startDate: string;
  endDate: string;
  department: string;
  description: string;
}

// Leave Credit
export interface LeaveCredit {
  id: number;
  employee_id: number;
  leave_type: string;
  balance: string;
  used?: string;
  total?: string;
}

// Job interface for recruitment
export type EmploymentType = 'Full-time' | 'Part-time' | 'Contractual' | 'Job Order' | 'Coterminous' | 'Temporary' | 'Probationary' | 'Casual' | 'Permanent';
export type JobStatus = 'Open' | 'Closed' | 'On Hold';
export type JobStatusFilter = 'All' | JobStatus;

// Job interface for recruitment
export interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  employment_type: EmploymentType;
  status: JobStatus; 
  job_description: string;
  requirements: string | null;
  salary_range?: string | null;
  office_name?: string | null;
  submission_address?: string | null;
  education?: string | null;
  experience?: string | null;
  training?: string | null;
  eligibility?: string | null;
  other_qualifications?: string | null;
  application_email: string;
  created_at?: string;
  posted_at?: string;
  attachment_path?: string | null;
  require_civil_service: boolean;
  require_government_ids: boolean;
  require_education_experience: boolean;
}

export interface JobFormData {
  title: string;
  department: string;
  location: string;
  employment_type: EmploymentType;
  status: JobStatus;
  job_description: string;
  requirements?: string | null;
  salary_range?: string | null;
  office_name?: string | null;
  submission_address?: string | null;
  education?: string | null;
  experience?: string | null;
  training?: string | null;
  eligibility?: string | null;
  other_qualifications?: string | null;
  application_email: string;
  attachment_path?: string | File | null;
  require_civil_service?: boolean;
  require_government_ids?: boolean;
  require_education_experience?: boolean;
}

export interface JobApplication {
  id: number;
  job_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  education: string;
  experience: string;
  skills: string;
  resume: string;
}
export interface JobApplicationForm {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
  education: string;
  experience: string;
  skills: string;
  resume: File | null;
}

// Basic types now strictly defined in ./employee.ts

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export interface SkillData {
  skill_name: string;
  proficiency_level?: string | null;
  category?: string | null;
  years_experience?: number | null;
}

export interface EducationData {
  institution: string;
  degree?: string | null;
  field_of_study?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  type?: string | null;
  description?: string | null;
}

export interface ContactData {
  name: string;
  relationship: string;
  phone_number: string;
  address?: string | null;
  email?: string | null;
  is_primary?: number | boolean | null;
}

export interface CustomFieldData {
  section: string;
  field_name: string;
  field_value?: string | null;
}

export const INITIAL_APPLICATION_STATE: JobApplicationForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  address: '',
  education: '',
  experience: '',
  skills: '',
  resume: null,
};