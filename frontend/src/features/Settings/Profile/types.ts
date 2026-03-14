import type { EmployeeDocument } from '../../../types';
export type { EmployeeDocument };

export interface BaseProfile {
  id?: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  suffix?: string | null;
  email?: string;
  employeeId?: string;
  role?: string;
  department?: string | null;
  departmentId?: number | null;
  jobTitle?: string | null;
  positionTitle?: string | null;
  dateHired?: string | null;
  employmentStatus?: string | null;
  employmentType?: string | null;
  appointmentType?: string | null;
  twoFactorEnabled?: boolean;
  avatarUrl?: string | null;
  
  // Personal Info
  birthDate?: string | null;
  gender?: string | null;
  civilStatus?: string | null;
  nationality?: string | null;
  placeOfBirth?: string | null;
  religion?: string | null;
  citizenship?: string | null;
  citizenshipType?: string | null;
  
  // Contact
  phoneNumber?: string | null;
  telephoneNo?: string | null;
  mobileNo?: string | null;
  address?: string | null; // residential fallback
  residentialAddress?: string | null;
  permanentAddress?: string | null;
  emergencyContact?: string | null;
  emergencyContactNumber?: string | null;
  
  // Work Details
  originalAppointmentDate?: string | null;
  lastPromotionDate?: string | null;
  regularizationDate?: string | null;
  contractEndDate?: string | null;
  isRegular?: boolean;
  station?: string | null;
  officeAddress?: string | null;
  itemNumber?: string | null;
  salaryGrade?: string | number | null;
  stepIncrement?: number | null;
  
  // Gov't IDs
  umidNumber?: string | null;
  philsysId?: string | null;
  philhealthNumber?: string | null;
  pagibigNumber?: string | null;
  tinNumber?: string | null;
  gsisNumber?: string | null;
  
  // Physical
  heightM?: string | number | null;
  weightKg?: string | number | null;
  bloodType?: string | null;
  
  // Academic & Eligibility
  educationalBackground?: string | null;
  schoolName?: string | null;
  course?: string | null;
  yearGraduated?: string | null;
  eligibilityType?: string | null;
  eligibilityNumber?: string | null;
  eligibilityDate?: string | null;
  yearsOfExperience?: number | null;
  
  // Social
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  twitterHandle?: string | null;
}

export interface Profile extends BaseProfile {
  documents?: EmployeeDocument[];
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  suffix: string;
  email: string;
  phoneNumber: string;
  mobileNo: string;
  telephoneNo: string;
  birthDate: string;
  gender: string;
  civilStatus: string;
  nationality: string;
  placeOfBirth: string;
  residentialAddress: string;
  permanentAddress: string;
  religion: string;
  citizenship: string;
  citizenshipType: string;
  
  // Work
  officeAddress: string;
  station: string;
  
  // Academic
  educationalBackground: string;
  schoolName: string;
  course: string;
  yearGraduated: string;
  
  // Gov IDs
  umidNumber: string;
  philsysId: string;
  philhealthNumber: string;
  pagibigNumber: string;
  tinNumber: string;
  gsisNumber: string;
  
  // Physical
  heightM: string;
  weightKg: string;
  bloodType: string;
  
  // Eligibility
  eligibilityType: string;
  eligibilityNumber: string;
  eligibilityDate: string;
  yearsOfExperience: string;
}
