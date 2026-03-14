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
  middleName?: string | null;
  suffix?: string | null;
  name: string;
  role: UserRole;
  department?: string | null;
  departmentId?: number | null;
  employeeId: string;
  avatarUrl?: string | null;
  jobTitle?: string | null;
  employmentStatus?: EmploymentStatus | null;
  twoFactorEnabled: boolean;
  dutyType: 'Standard' | 'Irregular';
  appointmentType?: 'Permanent' | 'Contractual' | 'Casual' | 'Job Order' | 'Coterminous' | 'Temporary' | 'Contract of Service' | 'JO' | 'COS' | null;
  profileStatus?: 'Initial' | 'Complete';
  
  // Personal & Contact
  birthDate?: string | null;
  gender?: "Male" | "Female" | null;
  civilStatus?: "Single" | "Married" | "Widowed" | "Separated" | "Annulled" | null;
  nationality?: string | null;
  bloodType?: string | null;
  heightM?: string | number | null;
  weightKg?: string | number | null;
  mobileNo?: string | null;
  telephoneNo?: string | null;
  address?: string | null;
  residentialAddress?: string | null;
  residentialZipCode?: string | null;
  resHouseBlockLot?: string | null;
  resStreet?: string | null;
  resSubdivision?: string | null;
  resBarangay?: string | null;
  resCity?: string | null;
  resProvince?: string | null;
  resRegion?: string | null;
  permanentAddress?: string | null;
  permanentZipCode?: string | null;
  permHouseBlockLot?: string | null;
  permStreet?: string | null;
  permSubdivision?: string | null;
  permBarangay?: string | null;
  permCity?: string | null;
  permProvince?: string | null;
  permRegion?: string | null;
  
  // Identifications
  gsisNumber?: string | null;
  pagibigNumber?: string | null;
  philhealthNumber?: string | null;
  umidNumber?: string | null;
  philsysId?: string | null;
  tinNumber?: string | null;
  
  // Emergency & Education
  emergencyContact?: string | null;
  emergencyContactNumber?: string | null;
  educationalBackground?: string | null;
  isVerified: boolean;
  duties: string;
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
  employeeId: string;
  // Raw fields
  scanTime?: string;
  type?: 'IN' | 'OUT';
  source: string;
  // DTR fields
  date?: string;
  timeIn?: string;
  timeOut?: string;
  // Common
  firstName?: string;
  lastName?: string;
  name?: string;
  department?: string;
  duties?: string;
  status?: string;
  scanDate?: Date; // Frontend helper for sorting/filtering
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
  employeeId: string;
  employeeName?: string;
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
  employeeId: string;
  leaveType: string;
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
  employmentType: EmploymentType;
  dutyType: 'Standard' | 'Irregular';
  status: JobStatus; 
  jobDescription: string;
  requirements: string | null;
  salaryRange?: string | null;
  officeName?: string | null;
  submissionAddress?: string | null;
  education?: string | null;
  experience?: string | null;
  training?: string | null;
  eligibility?: string | null;
  otherQualifications?: string | null;
  applicationEmail: string;
  createdAt?: string;
  postedAt?: string;
  attachmentPath?: string | null;
  requireCivilService: boolean;
  requireGovernmentIds: boolean;
  requireEducationExperience: boolean;
}

export interface JobFormData {
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  dutyType: 'Standard' | 'Irregular';
  status: JobStatus;
  jobDescription: string;
  requirements?: string | null;
  salaryRange?: string | null;
  officeName?: string | null;
  submissionAddress?: string | null;
  education?: string | null;
  experience?: string | null;
  training?: string | null;
  eligibility?: string | null;
  otherQualifications?: string | null;
  applicationEmail: string;
  attachmentPath?: string | File | null;
  requireCivilService?: boolean;
  requireGovernmentIds?: boolean;
  requireEducationExperience?: boolean;
}

export interface JobApplication {
  id: number;
  jobId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  education: string;
  experience: string;
  skills: string;
  resume: string;
}
export interface JobApplicationForm {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
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
  skillName: string;
  proficiencyLevel?: string | null;
  category?: string | null;
  yearsExperience?: number | null;
}

export interface EducationData {
  institution: string;
  degree?: string | null;
  fieldOfStudy?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  type?: string | null;
  description?: string | null;
}

export interface ContactData {
  name: string;
  relationship: string;
  phoneNumber: string;
  address?: string | null;
  email?: string | null;
  isPrimary?: number | boolean | null;
}

export interface CustomFieldData {
  section: string;
  fieldName: string;
  fieldValue?: string | null;
}

export const INITIAL_APPLICATION_STATE: JobApplicationForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  address: '',
  education: '',
  experience: '',
  skills: '',
  resume: null,
};