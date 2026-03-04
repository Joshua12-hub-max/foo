export type EmploymentType = 'Full-time' | 'Part-time' | 'Contractual' | 'Job Order' | 'Coterminous' | 'Temporary' | 'Probationary' | 'Casual' | 'Permanent';
export type JobStatus = 'Open' | 'Closed' | 'On Hold';
export type ApplicantStage = 'Applied' | 'Screening' | 'Initial Interview' | 'Final Interview' | 'Offer' | 'Hired' | 'Rejected';
export type ApplicantStatus = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
export type ApplicantSource = 'web' | 'email';
export type InterviewPlatform = 'Google Meet' | 'Zoom' | 'Other' | 'Jitsi Meet';

export interface Applicant {
  id: number;
  job_id?: number | null;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  email: string;
  phone_number?: string;
  address?: string;
  permanent_address?: string;
  zip_code?: string;
  permanent_zip_code?: string;
  is_meycauayan_resident?: number;
  resume_path?: string;
  photo_path?: string;
  eligibility_path?: string;
  photo_url?: string;
  status: ApplicantStatus;
  stage: ApplicantStage;
  source: ApplicantSource;
  email_subject?: string;
  email_received_at?: string;
  created_at: string;
  birth_date?: string;
  birth_place?: string;
  sex?: 'Male' | 'Female';
  civil_status?: 'Single' | 'Married' | 'Widowed' | 'Separated' | 'Annulled';
  height?: string;
  weight?: string;
  blood_type?: string;
  gsis_no?: string;
  pagibig_no?: string;
  philhealth_no?: string;
  umid_no?: string;
  philsys_id?: string;
  tin_no?: string;
  eligibility?: string;
  eligibility_type?: string;
  eligibility_date?: string;
  eligibility_rating?: string;
  eligibility_place?: string;
  license_no?: string;
  interview_date?: string;
  interview_link?: string;
  interview_platform?: InterviewPlatform;
  interview_notes?: string;
  interviewer_id?: number;
  interviewer_name?: string;
  education?: string;
  school_name?: string;
  course?: string;
  year_graduated?: string;
  experience?: string;
  skills?: string;
  total_experience_years?: number | string | null;
  hired_date?: string;
  job_title?: string;
  job_requirements?: string;
  job_department?: string;
  job_status?: JobStatus;
}

export interface Interviewer {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  job_title?: string;
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
