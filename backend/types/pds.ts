export interface PDSEducation {
  level?: 'Elementary' | 'Secondary' | 'Vocational' | 'College' | 'Graduate Studies' | string;
  schoolName?: string;
  degreeCourse?: string;
  yearGraduated?: number | string;
  unitsEarned?: string;
  dateFrom?: number | string;
  dateTo?: number | string;
  honors?: string;
}

export interface PDSEligibility {
  eligibilityName: string;
  rating?: number | string;
  examDate?: string;
  examPlace?: string;
  licenseNumber?: string;
  validityDate?: string;
}

export interface PDSWorkExperience {
  dateFrom: string;
  dateTo?: string;
  positionTitle: string;
  companyName: string;
  monthlySalary?: number | string;
  salaryGrade?: string;
  appointmentStatus?: string;
  isGovernment?: boolean | string;
}

export interface PDSLearningDevelopment {
  title: string;
  dateFrom?: string;
  dateTo?: string;
  hoursNumber?: number | string;
  typeOfLd?: string;
  conductedBy?: string;
}

export interface PDSVoluntaryWork {
  organizationName?: string;
  address?: string;
  dateFrom?: string;
  dateTo?: string;
  hoursNumber?: number | string;
  position?: string;
}

export interface PDSReference {
  name: string;
  address?: string;
  telNo?: string;
}

export interface PDSFamily {
  relationType: 'Spouse' | 'Father' | 'Mother' | 'Child';
  lastName?: string;
  surname?: string; // Synonym
  firstName?: string;
  middleName?: string;
  nameExtension?: string;
  extension?: string; // Synonym
  occupation?: string;
  employer?: string;
  businessAddress?: string;
  telephoneNo?: string;
  mobileNo?: string;
  dateOfBirth?: string;
}

export interface PDSOtherInfo {
  type: 'Skill' | 'Recognition' | 'Membership' | string;
  description: string;
  title?: string; // Synonym
  details?: string; // Synonym
}

export interface PDSFormData {
  // Names
  lastName?: string;
  surname?: string;
  firstName?: string;
  middleName?: string;
  maidenName?: string;
  suffix?: string;
  nameExtension?: string;
  
  // Personal Info
  birthDate?: string;
  dob?: string;
  placeOfBirth?: string;
  pob?: string;
  gender?: string;
  sex?: string;
  civilStatus?: string;
  height?: string;
  heightM?: string;
  weight?: string;
  weightKg?: string;
  bloodType?: string;
  
  // IDs
  gsisNumber?: string;
  gsisNo?: string;
  pagibigNumber?: string;
  pagibigNo?: string;
  philhealthNumber?: string;
  philhealthNo?: string;
  philsysId?: string;
  tinNumber?: string;
  tinNo?: string;
  agencyEmployeeNo?: string;
  umidNumber?: string;
  umidNo?: string;

  citizenship?: string;
  citizenshipType?: string;
  dualCountry?: string;
  
  // Addresses
  residentialAddress?: string;
  residentialZipCode?: string;
  resHouseBlockLot?: string;
  resStreet?: string;
  resSubdivision?: string;
  resBarangay?: string;
  resCity?: string;
  resProvince?: string;
  resRegion?: string;
  
  permanentAddress?: string;
  permanentZipCode?: string;
  permHouseBlockLot?: string;
  permStreet?: string;
  permSubdivision?: string;
  permBarangay?: string;
  permCity?: string;
  permProvince?: string;
  permRegion?: string;
  
  telephoneNo?: string;
  mobileNo?: string;
  email?: string;

  // Arrays
  educations?: PDSEducation[];
  eligibilities?: PDSEligibility[];
  workExperiences?: PDSWorkExperience[];
  trainings?: PDSLearningDevelopment[];
  voluntaryWorks?: PDSVoluntaryWork[];
  references?: PDSReference[];
  familyBackground?: PDSFamily[];
  otherInfo?: PDSOtherInfo[];
  
  // Declarations & Govt ID
  pdsQuestions?: PDSQuestions;
  govtIdType?: string;
  govtIdNo?: string;
  govtIdIssuance?: string;
  dateAccomplished?: string;
}

export interface PDSQuestions {
  relatedThirdDegree: boolean;
  relatedThirdDetails?: string;
  relatedFourthDegree: boolean;
  relatedFourthDetails?: string;
  foundGuiltyAdmin: boolean;
  foundGuiltyDetails?: string;
  criminallyCharged: boolean;
  dateFiled?: string;
  statusOfCase?: string;
  convictedCrime: boolean;
  convictedDetails?: string;
  separatedFromService: boolean;
  separatedDetails?: string;
  electionCandidate: boolean;
  electionDetails?: string;
  resignedToPromote: boolean;
  resignedDetails?: string;
  immigrantStatus: boolean;
  immigrantDetails?: string;
  indigenousMember: boolean;
  indigenousDetails?: string;
  personWithDisability: boolean;
  disabilityIdNo?: string;
  soloParent: boolean;
  soloParentIdNo?: string;
}

export interface PDSParsingResult {
  success: boolean;
  data?: Partial<PDSFormData>;
  error?: string;
  parsedAt?: string;
}
