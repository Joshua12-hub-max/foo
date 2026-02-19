export interface Profile {
  name?: string;
  email?: string;
  employeeId?: string;
  role?: string;
  department?: string;
  jobTitle?: string;
  dateHired?: string;
  employmentStatus?: string;
  twoFactorEnabled?: boolean;
  [key: string]: string | number | boolean | null | undefined;
}

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
}
