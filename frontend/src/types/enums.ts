export type UserRole = 'admin' | 'hr' | 'employee';

export type EmploymentStatus = 
  | 'Active'
  | 'Probationary'
  | 'Terminated'
  | 'Resigned'
  | 'On Leave'
  | 'Suspended'
  | 'Verbal Warning'
  | 'Written Warning'
  | 'Show Cause';

export type Gender = 'Male' | 'Female';

export type CivilStatus = 
  | 'Single'
  | 'Married'
  | 'Widowed'
  | 'Separated'
  | 'Annulled';

export type AppointmentType = 
  | 'Permanent'
  | 'Contractual'
  | 'Casual'
  | 'Job Order'
  | 'Coterminous'
  | 'Temporary';

export type CitizenshipType = 'By Birth' | 'By Naturalization';
