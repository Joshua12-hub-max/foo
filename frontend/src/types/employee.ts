export type { UserRole, EmploymentStatus, Gender, CivilStatus, AppointmentType, CitizenshipType } from './enums';

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  suffix: string | null;
  email: string;
  role: string;
  department?: string | null;
  departmentId?: number | null;
  employeeId: string;
  jobTitle?: string | null;
  positionTitle?: string | null;
  employmentStatus: string | null;
  employmentType: string | null;
  dateHired: string | null;
  contractEndDate: string | null;
  regularizationDate: string | null;
  isRegular: boolean;
  birthDate: string | null;
  gender: string | null;
  civilStatus: string | null;
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
  appointmentType: string | null;
  station: string | null;
  itemNumber: string | null;
  positionId: number | null;
  duties: string;
  shift?: string;
  experience: string | null;

  // PDS / Extended Fields
  heightM: string | number | null;
  weightKg: string | number | null;
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
  resRegion: string | null;
  permHouseBlockLot: string | null;
  permStreet: string | null;
  permSubdivision: string | null;
  permBarangay: string | null;
  permCity: string | null;
  permProvince: string | null;
  permRegion: string | null;
  
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

  // Section IX: Declarations
  relatedThirdDegree: string | null;
  relatedThirdDetails: string | null;
  relatedFourthDegree: string | null;
  relatedFourthDetails: string | null;
  foundGuiltyAdmin: string | null;
  foundGuiltyDetails: string | null;
  criminallyCharged: string | null;
  dateFiled: string | null;
  statusOfCase: string | null;
  convictedCrime: string | null;
  convictedDetails: string | null;
  separatedFromService: string | null;
  separatedDetails: string | null;
  electionCandidate: string | null;
  electionDetails: string | null;
  resignedToPromote: string | null;
  resignedDetails: string | null;
  immigrantStatus: string | null;
  immigrantDetails: string | null;
  indigenousMember: string | null;
  indigenousDetails: string | null;
  personWithDisability: string | null;
  disabilityIdNo: string | null;
  soloParent: string | null;
  soloParentIdNo: string | null;

  // Other PDS 2025 Fields
  dualCountry: string | null;
  govtIdType: string | null;
  govtIdNo: string | null;
  govtIdIssuance: string | null;
  startTime: string | null;
  endTime: string | null;
  dutyType: string | null;
  isMeycauayan: boolean | string | null;
  dateAccomplished: string | null;
  pdsQuestions: Record<string, unknown>;
}

// ─── PDS Sub-Interfaces (Strict for Wizard) ──────────────────────────────────

export interface Child {
  id?: string | number;
  fullName: string;
  dob: string;
}

export interface Eligibility {
  id?: string | number;
  eligibilityType: string;
  rating: string | number | null;
  examDate: string | null;
  examPlace: string | null;
  eligibilityNumber: string | null;
  validityDate: string | null;
}

export interface WorkExperience {
    id?: string | number;
    positionTitle: string;
    department: string;
    from: string;
    to: string;
    monthlySalary: string;
    salaryGrade: string;
    appointmentStatus: string;
    govtService: string;
}

export interface Training {
    id?: string | number;
    title: string;
    from: string;
    to: string;
    hours: string;
    ldType: string;
    conductedBy: string;
}

export interface VoluntaryWork {
    id?: string | number;
    organization: string;
    from: string;
    to: string;
    hours: string;
    positionNature: string;
}

export interface Reference {
    name: string;
    address: string;
    contact: string;
}

// ─── Database-aligned Interfaces ──────────────────────────────────────────────

export interface Skill {
  id: number;
  skillName: string;
  category: string;
  proficiencyLevel: string;
  yearsExperience: number | null;
}

export interface Education {
  id: number;
  level: 'Elementary' | 'Secondary' | 'Vocational' | 'College' | 'Graduate Studies' | string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: string | number | null;
  endDate: string | number | null;
  yearGraduated: number | string | null;
  unitsEarned: string | null;
  isCurrent: boolean | number;
  honors: string | null;
  type?: string | null;
}

export interface EmergencyContact {
  id: number;
  name: string;
  relationship: string;
  phoneNumber: string;
  email: string | null;
  address: string | null;
  isPrimary: boolean | number;
}

export interface VoluntaryWork_DB {
  id: number;
  organizationName: string;
  address: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  hoursNumber: number | null;
  position: string | null;
}

export interface LearningDevelopment {
  id: number;
  title: string;
  dateFrom: string | null;
  dateTo: string | null;
  hoursNumber: number | null;
  typeOfLd: string | null;
  conductedBy: string | null;
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
  voluntaryWork: VoluntaryWork_DB[];
  learningDevelopment: LearningDevelopment[];
  workExperience: WorkplaceExperience[];
  otherInfo: PdsOtherInfo[];
  references: PdsReference[];
  eligibilities: Eligibility[];
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
