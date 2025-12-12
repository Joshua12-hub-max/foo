/**
 * Employee Management Constants
 * Centralized configuration for employee forms, filters, and status options
 * Includes Philippine government worker specific fields
 */

// Role options for employee forms (no supervisor portal in this system)
export const ROLE_OPTIONS = [
  { value: 'employee', label: 'Employee' },
  { value: 'hr', label: 'Human Resource (HR)' },
  { value: 'admin', label: 'Admin' }
];

// Employment status options
export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Probationary', label: 'Probationary' },
  { value: 'On Leave', label: 'On Leave' },
  { value: 'Terminated', label: 'Terminated' },
  { value: 'Resigned', label: 'Resigned' }
];

// Appointment type options (Government specific)
export const APPOINTMENT_TYPE_OPTIONS = [
  { value: 'Permanent', label: 'Permanent' },
  { value: 'Contractual', label: 'Contractual' },
  { value: 'Casual', label: 'Casual' },
  { value: 'Job Order', label: 'Job Order' },
  { value: 'Coterminous', label: 'Coterminous' },
  { value: 'Temporary', label: 'Temporary' }
];

// Civil status options
export const CIVIL_STATUS_OPTIONS = [
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Widowed', label: 'Widowed' },
  { value: 'Separated', label: 'Separated' },
  { value: 'Annulled', label: 'Annulled' }
];

// Gender options
export const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' }
];

// Salary Grade options (SG-1 to SG-33)
export const SALARY_GRADE_OPTIONS = Array.from({ length: 33 }, (_, i) => ({
  value: `SG-${i + 1}`,
  label: `SG-${i + 1}`
}));

// Skill proficiency levels
export const PROFICIENCY_LEVELS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Expert', label: 'Expert' }
];

// Blood type options
export const BLOOD_TYPE_OPTIONS = [
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
export const NATIONALITY_OPTIONS = [
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
export const SKILL_CATEGORIES = [
  { value: 'Technical', label: 'Technical' },
  { value: 'Soft Skill', label: 'Soft Skill' },
  { value: 'Language', label: 'Language' },
  { value: 'Leadership', label: 'Leadership' },
  { value: 'Other', label: 'Other' }
];

// Education types
export const EDUCATION_TYPES = [
  { value: 'Education', label: 'Education' },
  { value: 'Certification', label: 'Certification' },
  { value: 'Training', label: 'Training' }
];

// Document types
export const DOCUMENT_TYPES = [
  { value: 'Contract', label: 'Contract' },
  { value: 'ID', label: 'ID' },
  { value: 'Resume', label: 'Resume' },
  { value: 'Certificate', label: 'Certificate' },
  { value: 'Transcript', label: 'Transcript' },
  { value: 'Other', label: 'Other' }
];

// Default form values for adding new employees
export const DEFAULT_ADD_FORM = {
  // Basic Info
  first_name: '',
  last_name: '',
  email: '',
  department: '',
  job_title: '',
  role: 'employee',
  employee_id: '',
  password: '',
  // Personal Info
  birth_date: '',
  gender: '',
  civil_status: '',
  nationality: 'Filipino',
  phone_number: '',
  address: '',
  // Government IDs
  sss_number: '',
  philhealth_number: '',
  pagibig_number: '',
  tin_number: '',
  gsis_number: '',
  // Employment Details
  salary_grade: '',
  step_increment: 1,
  appointment_type: '',
  station: '',
  position_title: ''
};

// Default form values for editing employees
export const DEFAULT_EDIT_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  department: '',
  job_title: '',
  role: 'employee',
  employment_status: 'Active',
  // Personal Info
  birth_date: '',
  gender: '',
  civil_status: '',
  nationality: 'Filipino',
  phone_number: '',
  address: '',
  permanent_address: '',
  // Government IDs
  sss_number: '',
  philhealth_number: '',
  pagibig_number: '',
  tin_number: '',
  gsis_number: '',
  // Employment Details
  salary_grade: '',
  step_increment: 1,
  appointment_type: '',
  station: '',
  position_title: '',
  supervisor: ''
};

// Default form values for profile editing
export const DEFAULT_PROFILE_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  phone_number: '',
  address: ''
};

// Status badge styling configuration
export const STATUS_BADGE_STYLES = {
  Active: 'bg-green-100 text-green-700',
  Regular: 'bg-green-100 text-green-700',
  Probationary: 'bg-blue-100 text-blue-700',
  'On Leave': 'bg-yellow-100 text-yellow-700',
  Terminated: 'bg-red-100 text-red-700',
  Resigned: 'bg-gray-100 text-gray-600'
};

// Appointment type badge styling
export const APPOINTMENT_BADGE_STYLES = {
  Permanent: 'bg-green-100 text-green-700',
  Contractual: 'bg-blue-100 text-blue-700',
  Casual: 'bg-yellow-100 text-yellow-700',
  'Job Order': 'bg-orange-100 text-orange-700',
  Coterminous: 'bg-purple-100 text-purple-700',
  Temporary: 'bg-gray-100 text-gray-600'
};

// Get status badge class based on status
export const getStatusBadgeClass = (status) => {
  return STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES.Active;
};

// Get appointment badge class
export const getAppointmentBadgeClass = (type) => {
  return APPOINTMENT_BADGE_STYLES[type] || APPOINTMENT_BADGE_STYLES.Permanent;
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error'
};

// Notification auto-dismiss duration (ms)
export const NOTIFICATION_DURATION = 3000;
