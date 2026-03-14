import { UserRole, EmploymentStatus, Gender, CivilStatus, AppointmentType } from './enums';

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  role: UserRole;
  department?: string | null;
  departmentId?: number | null;
  employeeId: string;
  jobTitle?: string | null;
  positionTitle?: string | null;
  employmentStatus: EmploymentStatus | null;
  employmentType: string | null;
  dateHired: string | null;
  contractEndDate: string | null;
  regularizationDate: string | null;
  isRegular: boolean;
  birthDate: string | null;
  gender: Gender | null;
  civilStatus: CivilStatus | null;
  nationality: string | null;
  phoneNumber: string | null;
  address: string | null;
  permanentAddress: string | null;
  barangay: string | null;
  religion: string | null;
  citizenship: string | null;
  citizenshipType: string | null;
  avatarUrl?: string | null;
  umidNumber: string | null;
  philsysId: string | null;
  philhealthNumber: string | null;
  pagibigNumber: string | null;
  tinNumber: string | null;
  gsisNumber: string | null;
  educationalBackground: string | null;
  schoolName: string | null;
  course: string | null;
  yearGraduated: string | null;
  coreCompetencies: string | null;
  salaryGrade: string | null;
  stepIncrement: number;
  appointmentType: AppointmentType | null;
  station: string | null;
  itemNumber: string | null;
  positionId: number | null;
  duties: string;
  experience: string | null;

  // PDS / Extended Fields
  heightM: string | null;
  weightKg: string | null;
  bloodType: string | null;
  placeOfBirth: string | null;
  residentialAddress: string | null;
  residentialZipCode: string | null;
  permanentZipCode: string | null;
  telephoneNo: string | null;
  mobileNo: string | null;
  agencyEmployeeNo: string | null;
  emergencyContact: string | null;
  emergencyContactNumber: string | null;
  resHouseBlockLot: string | null;
  resStreet: string | null;
  resSubdivision: string | null;
  resBarangay: string | null;
  resCity: string | null;
  resProvince: string | null;
  permHouseBlockLot: string | null;
  permStreet: string | null;
  permSubdivision: string | null;
  permBarangay: string | null;
  permCity: string | null;
  permProvince: string | null;
  rightThumbmarkUrl: string | null;
  ctcNo: string | null;
  ctcIssuedAt: string | null;
  ctcIssuedDate: string | null;
  
  facebookUrl: string | null;
  linkedinUrl: string | null;
  twitterHandle: string | null;
  
  // Eligibility
  eligibilityType: string | null;
  eligibilityNumber: string | null;
  eligibilityDate: string | null;
  yearsOfExperience: number;

  // Additional Employment Fields
  officeAddress: string | null;
  firstDayOfService: string | null;
  originalAppointmentDate: string | null;
  lastPromotionDate: string | null;
  isBiometricEnrolled: boolean;
}

export interface Skill {
  id: number;
  skillName: string;
  category: string;
  proficiencyLevel: string;
  yearsExperience: number | null;
}

export interface Education {
  id: number;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: number;
  type?: string | null;
}

export interface EmergencyContact {
  id: number;
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  isPrimary: number;
}

export interface VoluntaryWork {
  id: number;
  organizationName: string;
  address?: string;
  dateFrom?: string;
  dateTo?: string;
  hoursNumber?: number;
  position?: string;
}

export interface LearningDevelopment {
  id: number;
  title: string;
  dateFrom?: string;
  dateTo?: string;
  hoursNumber?: number;
  typeOfLd?: string;
  conductedBy?: string;
}

export interface WorkplaceExperience {
  id: number;
  dateFrom: string;
  dateTo?: string;
  positionTitle: string;
  companyName: string;
  monthlySalary?: string;
  salaryGrade?: string;
  appointmentStatus?: string;
  isGovernment?: boolean;
}

export interface CustomField {
  id: number;
  section: string;
  fieldName: string;
  fieldValue: string | null;
}

export interface FamilyMember {
  id: number;
  relationType: 'Spouse' | 'Father' | 'Mother' | 'Child' | string;
  lastName: string | null;
  firstName: string | null;
  middleName: string | null;
  nameExtension: string | null;
  occupation: string | null;
  employer: string | null;
  businessAddress: string | null;
  telephoneNo: string | null;
  dateOfBirth: string | null;
}

export interface PdsOtherInfo {
  id: number;
  type: 'Skill' | 'Recognition' | 'Membership' | string;
  description: string;
}

export interface PdsReference {
  id: number;
  name: string;
  address: string | null;
  telNo: string | null;
}


export interface EmployeeDetailed extends Employee {
  skills: Skill[];
  education: Education[];
  emergencyContacts: EmergencyContact[];
  customFields: CustomField[];
  familyBackground: FamilyMember[];
  voluntaryWork: VoluntaryWork[];
  learningDevelopment: LearningDevelopment[];
  workExperience: WorkplaceExperience[];
  otherInfo: PdsOtherInfo[];
  references: PdsReference[];
}

export interface EmployeeDocument {
  id: number;
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadedAt: string;
}
