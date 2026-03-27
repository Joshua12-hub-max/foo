export interface HiredApplicant {
  id: number;
  firstName: string;
  lastName: string;
  middleName: string | null;
  suffix: string | null;
  email: string;
  phoneNumber: string | null;
  photoPath: string | null;
  photo1x1Path?: string | null;
  photoUrl: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  sex: 'Male' | 'Female' | null;
  civilStatus: 'Single' | 'Married' | 'Widowed' | 'Separated' | 'Annulled' | null;
  height: string | null;
  weight: string | null;
  bloodType: string | null;
  gsisNumber: string | null;
  pagibigNumber: string | null;
  philhealthNumber: string | null;
  umidNumber: string | null;
  philsysId: string | null;
  tinNumber: string | null;
  eligibility: string | null;
  eligibilityType: string | null;
  eligibilityDate: string | null;
  eligibilityRating: string | null;
  eligibilityPlace: string | null;
  licenseNo: string | null;
  address: string | null;
  zipCode: string | null;
  permanentAddress: string | null;
  permanentZipCode: string | null;
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
  isMeycauayanResident: boolean | null;
  educationalBackground: string | null;
  schoolName: string | null;
  course: string | null;
  yearGraduated: string | null;
  experience: string | null;
  skills: string | null;
  totalExperienceYears: string | number | null;
  emergencyContact?: string | null;
  emergencyContactNumber?: string | null;
  hiredDate: string | null;
  startDate: string | null;
  highestDegree?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  employmentType?: string | null;
  dutyType?: 'Standard' | 'Irregular' | null;
  
  // 100% SUCCESS: Added missing fields for data integrity
  citizenship?: string | null;
  nationality?: string | null;
  citizenshipType?: string | null;
  dualCountry?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  twitterHandle?: string | null;
  telephoneNumber?: string | null;
  agencyEmployeeNo?: string | null;
  govtIdType?: string | null;
  govtIdNo?: string | null;
  govtIdIssuance?: string | null;
  training?: string | null;
  
  // 100% DATA FLOW: Expanded PDS fields for automated registration
  familyBackground?: string | null;
  children?: string | null;
  voluntaryWork?: string | null;
  otherInfo?: string | null;
  pdsReferences?: string | null;
  pdsQuestions?: string | null;
  
  // Relational Data
  educations?: ApplicantEducation[];
  experiences?: ApplicantExperience[];
  trainings?: ApplicantTraining[];
  eligibilities?: ApplicantEligibility[];
}

export interface ApplicantEducation {
  id: number;
  applicantId: number;
  level: 'Elementary' | 'Secondary' | 'Vocational' | 'College' | 'Graduate Studies';
  schoolName: string;
  degreeCourse: string | null;
  yearGraduated: string | null;
  unitsEarned: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  honors: string | null;
}

export interface ApplicantExperience {
  id: number;
  applicantId: number;
  dateFrom: string;
  dateTo: string | null;
  positionTitle: string;
  companyName: string;
  monthlySalary: string | number | null;
  salaryGrade: string | null;
  appointmentStatus: string | null;
  isGovernment: boolean | null;
}

export interface ApplicantTraining {
  id: number;
  applicantId: number;
  title: string;
  dateFrom: string | null;
  dateTo: string | null;
  hoursNumber: number | null;
  typeOfLd: string | null;
  conductedBy: string | null;
}

export interface ApplicantEligibility {
  id: number;
  applicantId: number;
  eligibilityName: string;
  rating: string | number | null;
  examDate: string | null;
  examPlace: string | null;
  licenseNumber: string | null;
  validityDate: string | null;
}
