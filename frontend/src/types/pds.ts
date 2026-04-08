// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL PARSER OUTPUT TYPES (matches backend PdsParserOutput exactly)
// ─────────────────────────────────────────────────────────────────────────────

export interface PdsPersonalInfo {
  birthDate?: string;
  placeOfBirth?: string;
  gender?: string;
  civilStatus?: string;
  heightM?: number;
  weightKg?: number;
  bloodType?: string;
  citizenship?: string;
  citizenshipType?: string;
  dualCountry?: string;
  telephoneNo?: string;
  mobileNo?: string;
  gsisNumber?: string;
  pagibigNumber?: string;
  philhealthNumber?: string;
  tinNumber?: string;
  umidNumber?: string;
  philsysId?: string;
  agencyEmployeeNo?: string;
  resHouseBlockLot?: string;
  resStreet?: string;
  resSubdivision?: string;
  resBarangay?: string;
  resCity?: string;
  resProvince?: string;
  resRegion?: string;
  residentialZipCode?: string;
  permHouseBlockLot?: string;
  permStreet?: string;
  permSubdivision?: string;
  permBarangay?: string;
  permCity?: string;
  permProvince?: string;
  permRegion?: string;
  permanentZipCode?: string;
}

export interface PdsEducationItem {
  level: 'Elementary' | 'Secondary' | 'Vocational' | 'College' | 'Graduate Studies';
  schoolName: string;
  degreeCourse?: string;
  dateFrom?: string;
  dateTo?: string;
  unitsEarned?: string;
  yearGraduated?: number;
  honors?: string;
}

export interface PdsEligibilityItem {
  eligibilityName: string;
  rating?: number;
  examDate?: string;
  examPlace?: string;
  licenseNumber?: string;
  validityDate?: string;
}

export interface PdsWorkExperienceItem {
  dateFrom: string;
  dateTo?: string;
  positionTitle: string;
  companyName: string;
  monthlySalary?: number;
  salaryGrade?: string;
  appointmentStatus?: string;
  isGovernment: boolean;
}

export interface PdsLearningDevelopmentItem {
  title: string;
  dateFrom?: string;
  dateTo?: string;
  hoursNumber?: number;
  typeOfLd?: string;
  conductedBy?: string;
}

export interface PdsVoluntaryWorkItem {
  organizationName: string;
  address?: string;
  dateFrom?: string;
  dateTo?: string;
  hoursNumber?: number;
  position?: string;
}

export interface PdsReferenceItem {
  name: string;
  address?: string;
  telNo?: string;
}

export interface PdsFamilyItem {
  relationType: 'Spouse' | 'Father' | 'Mother' | 'Child';
  lastName?: string;
  firstName?: string;
  middleName?: string;
  nameExtension?: string;
  occupation?: string;
  employer?: string;
  businessAddress?: string;
  telephoneNo?: string;
  dateOfBirth?: string;
}

export interface PdsOtherInfoItem {
  type: 'Skill' | 'Recognition' | 'Membership';
  description: string;
}

export interface PdsDeclarationsData {
  relatedThirdDegree?: boolean;
  relatedThirdDetails?: string;
  relatedFourthDegree?: boolean;
  relatedFourthDetails?: string;
  foundGuiltyAdmin?: boolean;
  foundGuiltyDetails?: string;
  criminallyCharged?: boolean;
  dateFiled?: string;
  statusOfCase?: string;
  convictedCrime?: boolean;
  convictedDetails?: string;
  separatedFromService?: boolean;
  separatedDetails?: string;
  electionCandidate?: boolean;
  electionDetails?: string;
  resignedToPromote?: boolean;
  resignedDetails?: string;
  immigrantStatus?: boolean;
  immigrantDetails?: string;
  indigenousMember?: boolean;
  indigenousDetails?: string;
  personWithDisability?: boolean;
  disabilityIdNo?: string;
  soloParent?: boolean;
  soloParentIdNo?: string;
  govtIdType?: string;
  govtIdNo?: string;
  govtIdIssuance?: string;
  dateAccomplished?: string;
}

// Full canonical parser output — matches backend PdsParserOutput
export interface PdsParserOutput {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  personal: PdsPersonalInfo;
  educations: PdsEducationItem[];
  eligibilities: PdsEligibilityItem[];
  workExperiences: PdsWorkExperienceItem[];
  learningDevelopments: PdsLearningDevelopmentItem[];
  voluntaryWorks: PdsVoluntaryWorkItem[];
  references: PdsReferenceItem[];
  familyBackground: PdsFamilyItem[];
  otherInfo: PdsOtherInfoItem[];
  declarations?: Partial<PdsDeclarationsData>;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY DB ROW TYPES (used by profile display components)
// ─────────────────────────────────────────────────────────────────────────────

export interface PDSEducation {
    id: number;
    employeeId: string;
    level: 'Elementary' | 'Secondary' | 'Vocational' | 'College' | 'Graduate Studies';
    schoolName: string;
    degreeCourse?: string;
    yearGraduated?: number;
    unitsEarned?: string;
    dateFrom?: number;
    dateTo?: number;
    honors?: string;
    createdAt?: string;
}

export interface PDSEligibility {
    id: number;
    employeeId: string;
    eligibilityName: string;
    rating?: number;
    examDate?: string;
    examPlace?: string;
    licenseNumber?: string;
    validityDate?: string;
    createdAt?: string;
}

export interface PDSFamily {
    id: number;
    employeeId: string;
    relationType: 'Spouse' | 'Father' | 'Mother' | 'Child';
    lastName?: string;
    firstName?: string;
    middleName?: string;
    nameExtension?: string;
    occupation?: string;
    employer?: string;
    businessAddress?: string;
    telephoneNo?: string;
    dateOfBirth?: string;
    createdAt?: string;
}

export interface PDSLearningDevelopment {
    id: number;
    employeeId: string;
    title: string;
    dateFrom?: string;
    dateTo?: string;
    hoursNumber?: number;
    typeOfLd?: string;
    conductedBy?: string;
    createdAt?: string;
}

export interface PDSOtherInfo {
    id: number;
    employeeId: string;
    type: 'Skill' | 'Recognition' | 'Membership';
    description: string;
    createdAt?: string;
}

export interface PDSReference {
    id: number;
    employeeId: string;
    name: string;
    address?: string;
    telNo?: string;
    createdAt?: string;
}

export interface PDSVoluntaryWork {
    id: number;
    employeeId: string;
    organizationName: string;
    address?: string;
    dateFrom?: string;
    dateTo?: string;
    hoursNumber?: number;
    position?: string;
    createdAt?: string;
}

export interface PDSWorkExperience {
    id: number;
    employeeId: string;
    dateFrom: string;
    dateTo?: string;
    positionTitle: string;
    companyName: string;
    monthlySalary?: number;
    salaryGrade?: string;
    appointmentStatus?: string;
    isGovernment?: boolean;
    createdAt?: string;
}

export interface EmployeeCustomField {
    id: number;
    employeeId: string;
    section: string;
    fieldName: string;
    fieldValue?: string;
    createdAt?: string;
    updatedAt?: string;
}
