export interface Profile {
  name?: string;
  email?: string;
  employeeId?: string;
  role?: string;
  department?: string | null;
  jobTitle?: string | null;
  dateHired?: string;
  employmentStatus?: string | null;
  twoFactorEnabled?: boolean;
  address?: string;
  residentialAddress?: string;
  permanentAddress?: string;
  emergencyContact?: string;
  emergencyContactNumber?: string;
  educationalBackground?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
}
