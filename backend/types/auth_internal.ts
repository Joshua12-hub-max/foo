import { PdsEducation, PdsEligibility, PdsWorkExperience, PdsLearningDevelopment, PdsFamily, PdsOtherInfo } from './pds.js';

export interface RawPDSInput {
  educations?: string | PdsEducation[];
  eligibilities?: string | PdsEligibility[];
  workExperiences?: string | PdsWorkExperience[];
  learningDevelopments?: string | PdsLearningDevelopment[];
  familyBackground?: string | PdsFamily[];
  otherInfo?: string | PdsOtherInfo[];
  [key: string]: unknown;
}

export interface MappedEducation extends PdsEducation {
    id?: number;
}

export interface MappedEligibility extends PdsEligibility {
    id?: number;
}

export interface MappedWorkExperience extends PdsWorkExperience {
    id?: number;
}

export interface MappedTraining extends PdsLearningDevelopment {
    id?: number;
}

export interface MappedFamily extends PdsFamily {
    id?: number;
}

export interface MappedOtherInfo extends PdsOtherInfo {
    id?: number;
}
