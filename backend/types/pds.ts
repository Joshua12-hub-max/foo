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
  sssNumber?: string;
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
  emergencyContact?: string;
  emergencyContactNumber?: string;
}

export interface PdsEducation {
  level: 'Elementary' | 'Secondary' | 'Vocational' | 'College' | 'Graduate Studies';
  schoolName: string;
  degreeCourse?: string;
  dateFrom?: string;
  dateTo?: string;
  unitsEarned?: string;
  yearGraduated?: number;
  honors?: string;
}

export interface PdsEligibility {
  eligibilityName: string;
  rating?: number;
  examDate?: string;
  examPlace?: string;
  licenseNumber?: string;
  validityDate?: string;
}

export interface PdsWorkExperience {
  dateFrom: string;
  dateTo?: string;
  positionTitle: string;
  companyName: string;
  monthlySalary?: number;
  salaryGrade?: string;
  appointmentStatus?: string;
  isGovernment: boolean;
}

export interface PdsLearningDevelopment {
  title: string;
  dateFrom?: string;
  dateTo?: string;
  hoursNumber?: number;
  typeOfLd?: string;
  conductedBy?: string;
}

export interface PdsVoluntaryWork {
  organizationName: string;
  address?: string;
  dateFrom?: string;
  dateTo?: string;
  hoursNumber?: number;
  position?: string;
}

export interface PdsReference {
  name: string;
  address?: string;
  telNo?: string;
}

export interface PdsFamily {
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

export interface PdsOtherInfo {
  type: 'Skill' | 'Recognition' | 'Membership';
  description: string;
}

export interface PdsDeclarations {
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
  govtIdType?: string;
  govtIdNo?: string;
  govtIdIssuance?: string;
  dateAccomplished?: string;
}

export interface PdsParserOutput {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  personal: PdsPersonalInfo;
  educations: PdsEducation[];
  eligibilities: PdsEligibility[];
  workExperiences: PdsWorkExperience[];
  learningDevelopments: PdsLearningDevelopment[];
  voluntaryWorks: PdsVoluntaryWork[];
  references: PdsReference[];
  familyBackground: PdsFamily[];
  otherInfo: PdsOtherInfo[];
  declarations?: Partial<PdsDeclarations>;
}
