// Type definitions for employee constants
export interface SelectOption {
  value: string;
  label: string;
}

// Role options for employee forms (no supervisor portal in this system)
export const ROLE_OPTIONS: SelectOption[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'Human Resource', label: 'Human Resource (HR)' },
  { value: 'admin', label: 'Admin' }
];

// Department options (Static fallback)
export const DEPARTMENT_OPTIONS: SelectOption[] = [
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Finance', label: 'Finance' },
  { value: 'IT', label: 'IT' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Administration', label: 'Administration' }
];

// Employment status options (including disciplinary statuses)
export const EMPLOYMENT_STATUS_OPTIONS: SelectOption[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Probationary', label: 'Probationary' },
  { value: 'On Leave', label: 'On Leave' },
  { value: 'Suspended', label: 'Suspended' },
  { value: 'Verbal Warning', label: 'Verbal Warning' },
  { value: 'Written Warning', label: 'Written Warning' },
  { value: 'Show Cause', label: 'Show Cause' },
  { value: 'Terminated', label: 'Terminated' },
  { value: 'Resigned', label: 'Resigned' }
];

// Appointment type options (Government specific)
export const APPOINTMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: 'Permanent', label: 'Permanent' },
  { value: 'Contractual', label: 'Contractual' },
  { value: 'Casual', label: 'Casual' },
  { value: 'Job Order', label: 'Job Order' },
  { value: 'Coterminous', label: 'Coterminous' },
  { value: 'Temporary', label: 'Temporary' }
];

// Civil status options
export const CIVIL_STATUS_OPTIONS: SelectOption[] = [
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Widowed', label: 'Widowed' },
  { value: 'Separated', label: 'Separated' },
  { value: 'Annulled', label: 'Annulled' }
];

// Gender options
export const GENDER_OPTIONS: SelectOption[] = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' }
];

// Salary Grade options (SG-1 to SG-33)
export const SALARY_GRADE_OPTIONS: SelectOption[] = Array.from({ length: 33 }, (_, i) => ({
  value: `SG-${i + 1}`,
  label: `SG-${i + 1}`
}));

// Skill proficiency levels
export const PROFICIENCY_LEVELS: SelectOption[] = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Expert', label: 'Expert' }
];

// Blood type options
export const BLOOD_TYPE_OPTIONS: SelectOption[] = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' }
];

// Nationality options
export const NATIONALITY_OPTIONS: SelectOption[] = [
  { value: 'Filipino', label: 'Filipino' },
  { value: 'American', label: 'American' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Indian', label: 'Indian' },
  { value: 'British', label: 'British' },
  { value: 'Australian', label: 'Australian' },
  { value: 'Canadian', label: 'Canadian' },
  { value: 'Other', label: 'Other' }
];

// Skill categories
export const SKILL_CATEGORIES: SelectOption[] = [
  { value: 'Technical', label: 'Technical' },
  { value: 'Soft Skill', label: 'Soft Skill' },
  { value: 'Language', label: 'Language' },
  { value: 'Leadership', label: 'Leadership' },
  { value: 'Other', label: 'Other' }
];

// Education types
export const EDUCATION_TYPES: SelectOption[] = [
  { value: 'Education', label: 'Education' },
  { value: 'Certification', label: 'Certification' },
  { value: 'Training', label: 'Training' }
];

// Eligibility type options (CSC Plantilla Required)
export const ELIGIBILITY_TYPE_OPTIONS: SelectOption[] = [
  { value: 'CS Professional', label: 'CS Professional' },
  { value: 'CS Sub-Professional', label: 'CS Sub-Professional' },
  { value: 'RA 1080 (CPA)', label: 'RA 1080 (CPA)' },
  { value: 'RA 1080 (LET)', label: 'RA 1080 (LET)' },
  { value: 'RA 544 (CE)', label: 'RA 544 (Registered Civil Engineer)' },
  { value: 'RA 382 (ME)', label: 'RA 382 (Registered Mechanical Engineer)' },
  { value: 'RA 9292 (EE)', label: 'RA 9292 (Registered Electrical Engineer)' },
  { value: 'Bar Passer', label: 'Bar Passer' },
  { value: 'PRC License', label: 'PRC License (Other)' },
  { value: 'None', label: 'None Required' }
];

// Document types
export const DOCUMENT_TYPES: SelectOption[] = [
  { value: 'Contract', label: 'Contract' },
  { value: 'ID', label: 'ID' },
  { value: 'Resume', label: 'Resume' },
  { value: 'Certificate', label: 'Certificate' },
  { value: 'Transcript', label: 'Transcript' },
  { value: 'Other', label: 'Other' }
];

// Form data interfaces
export interface AddEmployeeForm {
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  job_title: string;
  role: string;
  employee_id: string;
  password: string;
  birth_date: string;
  gender: string;
  civil_status: string;
  nationality: string;
  phone_number: string;
  address: string;
  philhealth_number: string;
  pagibig_number: string;
  tin_number: string;
  gsis_number: string;
  salary_grade: string;
  step_increment: number;
  appointment_type: string;
  station: string;
  position_title: string;
  // Plantilla-required eligibility fields
  eligibility_type: string;
  eligibility_number: string;
  eligibility_date: string;
  highest_education: string;
  years_of_experience: number;
  // Social Media
  facebook_url: string;
  linkedin_url: string;
  twitter_handle: string;
}

export interface EditEmployeeForm extends AddEmployeeForm {
  employment_status: string;
  permanent_address: string;
  supervisor: string;
  blood_type?: string;
  height_cm?: string;
  weight_kg?: string;
  emergency_contact?: string;
  emergency_contact_number?: string;
  item_number?: string;
}

export interface ProfileForm {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  address: string;
}

// Default form values for adding new employees
export const DEFAULT_ADD_FORM: AddEmployeeForm = {
  first_name: '',
  last_name: '',
  email: '',
  department: '',
  job_title: '',
  role: 'employee',
  employee_id: '',
  password: '',
  birth_date: '',
  gender: '',
  civil_status: '',
  nationality: 'Filipino',
  phone_number: '',
  address: '',
  philhealth_number: '',
  pagibig_number: '',
  tin_number: '',
  gsis_number: '',
  salary_grade: '',
  step_increment: 1,
  appointment_type: '',
  station: '',
  position_title: '',
  // Plantilla-required eligibility fields
  eligibility_type: '',
  eligibility_number: '',
  eligibility_date: '',
  highest_education: '',
  years_of_experience: 0,
  // Social Media
  facebook_url: '',
  linkedin_url: '',
  twitter_handle: ''
};

// Default form values for editing employees
export const DEFAULT_EDIT_FORM: EditEmployeeForm = {
  first_name: '',
  last_name: '',
  email: '',
  department: '',
  job_title: '',
  role: 'employee',
  employment_status: 'Active',
  employee_id: '',
  password: '',
  birth_date: '',
  gender: '',
  civil_status: '',
  nationality: 'Filipino',
  phone_number: '',
  address: '',
  permanent_address: '',
  philhealth_number: '',
  pagibig_number: '',
  tin_number: '',
  gsis_number: '',
  salary_grade: '',
  step_increment: 1,
  appointment_type: '',
  station: '',
  position_title: '',
  supervisor: '',
  // Plantilla-required eligibility fields
  eligibility_type: '',
  eligibility_number: '',
  eligibility_date: '',
  highest_education: '',
  years_of_experience: 0,
  // Social Media
  facebook_url: '',
  linkedin_url: '',
  twitter_handle: ''
};

// Default form values for profile editing
export const DEFAULT_PROFILE_FORM: ProfileForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  address: ''
};

// Status badge styling configuration
export const STATUS_BADGE_STYLES: Record<string, string> = {
  Active: 'bg-green-100 text-green-700',
  Regular: 'bg-green-100 text-green-700',
  Probationary: 'bg-blue-100 text-blue-700',
  'On Leave': 'bg-yellow-100 text-yellow-700',
  Suspended: 'bg-red-500 text-white',
  'Verbal Warning': 'bg-yellow-100 text-yellow-700',
  'Written Warning': 'bg-amber-100 text-amber-700',
  'Show Cause': 'bg-purple-100 text-purple-700',
  Terminated: 'bg-red-100 text-red-700',
  Resigned: 'bg-gray-100 text-gray-600'
};

// Appointment type badge styling
export const APPOINTMENT_BADGE_STYLES: Record<string, string> = {
  Permanent: 'bg-green-100 text-green-700',
  Contractual: 'bg-blue-100 text-blue-700',
  Casual: 'bg-yellow-100 text-yellow-700',
  'Job Order': 'bg-orange-100 text-orange-700',
  Coterminous: 'bg-purple-100 text-purple-700',
  Temporary: 'bg-gray-100 text-gray-600'
};

// Get status badge class based on status
export const getStatusBadgeClass = (status: string): string => {
  return STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.Active;
};

// Get appointment badge class
export const getAppointmentBadgeClass = (type: string): string => {
  return APPOINTMENT_BADGE_STYLES[type] || APPOINTMENT_BADGE_STYLES.Permanent;
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error'
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Notification auto-dismiss duration (ms)
export const NOTIFICATION_DURATION = 3000;

// Date formatter
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};
