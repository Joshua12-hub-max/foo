// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL PARSER OUTPUT TYPES (matches backend PdsParserOutput exactly)
// ─────────────────────────────────────────────────────────────────────────────

export interface PdsPersonalInfo {
  birthDate?: string | null;
  placeOfBirth?: string | null;
  gender?: string | null;
  civilStatus?: string | null;
  heightM?: number | null;
  weightKg?: number | null;
  bloodType?: string | null;
  citizenship?: string | null;
  citizenshipType?: string | null;
  dualCountry?: string | null;
  telephoneNo?: string | null;
  mobileNo?: string | null;
  gsisNumber?: string | null;
  pagibigNumber?: string | null;
  philhealthNumber?: string | null;
  tinNumber?: string | null;
  umidNumber?: string | null;
  philsysId?: string | null;
  agencyEmployeeNo?: string | null;
  resHouseBlockLot?: string | null;
  resStreet?: string | null;
  resSubdivision?: string | null;
  resBarangay?: string | null;
  resCity?: string | null;
  resProvince?: string | null;
  resRegion?: string | null;
  residentialZipCode?: string | null;
  permHouseBlockLot?: string | null;
  permStreet?: string | null;
  permSubdivision?: string | null;
  permBarangay?: string | null;
  permCity?: string | null;
  permProvince?: string | null;
  permRegion?: string | null;
  permanentZipCode?: string | null;
}

export interface PdsEducationItem {
  level: 'Elementary' | 'Secondary' | 'Vocational' | 'College' | 'Graduate Studies';
  schoolName: string;
  degreeCourse?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  unitsEarned?: string | null;
  yearGraduated?: number | null;
  honors?: string | null;
}

export interface PdsEligibilityItem {
  eligibilityName: string;
  rating?: number | null;
  examDate?: string | null;
  examPlace?: string | null;
  licenseNumber?: string | null;
  validityDate?: string | null;
}

export interface PdsWorkExperienceItem {
  dateFrom: string | null;
  dateTo?: string | null;
  positionTitle: string;
  companyName: string;
  monthlySalary?: number | null;
  salaryGrade?: string | null;
  appointmentStatus?: string | null;
  isGovernment: boolean;
}

export interface PdsLearningDevelopmentItem {
  title: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  hoursNumber?: number | null;
  typeOfLd?: string | null;
  conductedBy?: string | null;
}

export interface PdsVoluntaryWorkItem {
  organizationName: string;
  address?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  hoursNumber?: number | null;
  position?: string | null;
}

export interface PdsReferenceItem {
  name: string;
  address?: string | null;
  telNo?: string | null;
}

export interface PdsFamilyItem {
  relationType: 'Spouse' | 'Father' | 'Mother' | 'Child';
  lastName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  nameExtension?: string | null;
  occupation?: string | null;
  employer?: string | null;
  businessAddress?: string | null;
  telephoneNo?: string | null;
  dateOfBirth?: string | null;
}

export interface PdsOtherInfoItem {
  type: 'Skill' | 'Recognition' | 'Membership';
  description: string;
}

export interface PdsDeclarationsData {
  relatedThirdDegree?: boolean | null;
  relatedThirdDetails?: string | null;
  relatedFourthDegree?: boolean | null;
  relatedFourthDetails?: string | null;
  foundGuiltyAdmin?: boolean | null;
  foundGuiltyDetails?: string | null;
  criminallyCharged?: boolean | null;
  dateFiled?: string | null;
  statusOfCase?: string | null;
  convictedCrime?: boolean | null;
  convictedDetails?: string | null;
  separatedFromService?: boolean | null;
  separatedDetails?: string | null;
  electionCandidate?: boolean | null;
  electionDetails?: string | null;
  resignedToPromote?: boolean | null;
  resignedDetails?: string | null;
  immigrantStatus?: boolean | null;
  immigrantDetails?: string | null;
  indigenousMember?: boolean | null;
  indigenousDetails?: string | null;
  personWithDisability?: boolean | null;
  disabilityIdNo?: string | null;
  soloParent?: boolean | null;
  soloParentIdNo?: string | null;
  govtIdType?: string | null;
  govtIdNo?: string | null;
  govtIdIssuance?: string | null;
  dateAccomplished?: string | null;
}

// Full canonical parser output — matches backend PdsParserOutput
export interface PdsParserOutput {
  firstName?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  email?: string | null;
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
    degreeCourse?: string | null;
    yearGraduated?: number | null;
    unitsEarned?: string | null;
    dateFrom?: number | null;
    dateTo?: number | null;
    honors?: string | null;
    createdAt?: string | null;
}

export interface PDSEligibility {
    id: number;
    employeeId: string;
    eligibilityName: string;
    rating?: number | null;
    examDate?: string | null;
    examPlace?: string | null;
    licenseNumber?: string | null;
    validityDate?: string | null;
    createdAt?: string | null;
}

export interface PDSFamily {
    id: number;
    employeeId: string;
    relationType: 'Spouse' | 'Father' | 'Mother' | 'Child';
    lastName?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    nameExtension?: string | null;
    occupation?: string | null;
    employer?: string | null;
    businessAddress?: string | null;
    telephoneNo?: string | null;
    dateOfBirth?: string | null;
    createdAt?: string | null;
}

export interface PDSLearningDevelopment {
    id: number;
    employeeId: string;
    title: string;
    dateFrom?: string | null;
    dateTo?: string | null;
    hoursNumber?: number | null;
    typeOfLd?: string | null;
    conductedBy?: string | null;
    createdAt?: string | null;
}

export interface PDSOtherInfo {
    id: number;
    employeeId: string;
    type: 'Skill' | 'Recognition' | 'Membership';
    description: string;
    createdAt?: string | null;
}

export interface PDSReference {
    id: number;
    employeeId: string;
    name: string;
    address?: string | null;
    telNo?: string | null;
    createdAt?: string | null;
}

export interface PDSVoluntaryWork {
    id: number;
    employeeId: string;
    organizationName: string;
    address?: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
    hoursNumber?: number | null;
    position?: string | null;
    createdAt?: string | null;
}

export interface PDSWorkExperience {
    id: number;
    employeeId: string;
    dateFrom: string | null;
    dateTo?: string | null;
    positionTitle: string;
    companyName: string;
    monthlySalary?: number | null;
    salaryGrade?: string | null;
    appointmentStatus?: string | null;
    isGovernment?: boolean | null;
    createdAt?: string | null;
}

export interface EmployeeCustomField {
    id: number;
    employeeId: string;
    section: string;
    fieldName: string;
    fieldValue?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}
