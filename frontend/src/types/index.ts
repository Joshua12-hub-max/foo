export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  department_id?: number;
  department_name?: string;
  department?: string; 
  position?: string;
  position_id?: number;
  avatar?: string;
  profilePicture?: string;
  name?: string;
  employeeId?: string | number;
  employee_id?: string | number;
  employment_status?: string;
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

// Employee base interface
export interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  department?: string;
  department_id?: number;
  position?: string;
  job_title?: string;
  position_id?: number;
  employee_id?: string | number;
  avatar_url?: string;
  status?: string;
}

// Attendance Header
export interface AttendanceHeader {
  key: string;
  label: string;
  sortable?: boolean;
}

// Biometrics Log
export interface BiometricsLog {
  id: number;
  employee_id?: string | number;
  employee_name?: string;
  timestamp?: string;
  created_at?: string;
  updated_at?: string;
  name?: string;
  department?: string;
  status?: string;
  type?: string;
}

// DTR Correction interfaces
export interface DTRCorrectionRecord {
  id: string | number;
  employeeId?: string | number;
  employeeName?: string;
  requestDate?: string;
  date?: string;
  time_in?: string;
  time_out?: string;
  reason?: string;
  status?: string;
  created_at?: string;
}

// Attendance Record
export interface AttendanceRecord {
  id: number;
  employee_id?: number;
  employee_name?: string;
  date: string;
  time_in?: string;
  time_out?: string;
  timeIn?: string;
  timeOut?: string;
  status?: string;
  daily_status?: string;
  department?: string;
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
export type JobStatus = 'Open' | 'Closed' | 'On Hold';
export type JobStatusFilter = 'All' | JobStatus;

// Job interface for recruitment
export interface Job {
  id: number;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  status: string; // Keep string for compatibility with backend or update to JobStatus | string
  job_description: string;
  requirements: string;
  salary_range?: string;
  application_email?: string;
  created_at?: string;
  posted_at?: string;
}

export interface JobFormData {
  title: string;
  department: string;
  location: string;
  employment_type: string;
  status: string; // JobStatus | string
  job_description: string;
  requirements: string;
  salary_range: string;
  application_email: string;
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