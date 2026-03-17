export type EmploymentType = 'Full-time' | 'Part-time' | 'Contractual' | 'Job Order' | 'Coterminous' | 'Temporary' | 'Probationary' | 'Casual' | 'Permanent';
export type JobStatus = 'Open' | 'Closed' | 'On Hold';
export type ApplicantStage = 'Applied' | 'Screening' | 'Initial Interview' | 'Final Interview' | 'Offer' | 'Hired' | 'Rejected';
export type ApplicantStatus = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
export type ApplicantSource = 'web' | 'email';
export type InterviewPlatform = 'Google Meet' | 'Zoom' | 'Other' | 'Jitsi Meet';

export interface Applicant {
  id: number;
  jobId?: number | null;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  permanentAddress?: string;
  zipCode?: string;
  permanentZipCode?: string;
  isMeycauayanResident?: boolean;
  resumePath?: string;
  photoPath?: string;
  eligibilityPath?: string;
  photoUrl?: string;
  status: ApplicantStatus;
  stage: ApplicantStage;
  source: ApplicantSource;
  emailSubject?: string;
  emailReceivedAt?: string;
  createdAt: string;
  updatedAt?: string;
  birthDate?: string;
  birthPlace?: string;
  sex?: 'Male' | 'Female';
  civilStatus?: 'Single' | 'Married' | 'Widowed' | 'Separated' | 'Annulled';
  height?: string;
  weight?: string;
  bloodType?: string;
  gsisNumber?: string;
  pagibigNumber?: string;
  philhealthNumber?: string;
  umidNumber?: string;
  philsysId?: string;
  tinNumber?: string;
  eligibility?: string;
  eligibilityType?: string;
  eligibilityDate?: string;
  eligibilityRating?: string;
  eligibilityPlace?: string;
  licenseNo?: string;
  interviewDate?: string;
  interviewLink?: string;
  interviewPlatform?: InterviewPlatform;
  interviewNotes?: string;
  interviewerId?: number;
  interviewerName?: string;
  educationalBackground?: string;
  schoolName?: string;
  course?: string;
  yearGraduated?: string;
  experience?: string;
  skills?: string;
  totalExperienceYears?: number | string | null;
  hiredDate?: string;
  jobTitle?: string;
  jobRequirements?: string;
  jobDepartment?: string;
  jobStatus?: JobStatus;
  jobEmploymentType?: string;
  jobDutyType?: string;
  isConfirmed?: boolean;
  startDate?: string;
}

export interface Interviewer {
  id: number;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  jobTitle?: string;
  role?: string;
  department?: string;
}

export interface RecruitmentStats {
  total: number;
  pending: number;
  screening: number;
  interviewing: number;
  hired: number;
  rejected: number;
}
