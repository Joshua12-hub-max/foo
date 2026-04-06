import { PDSEducation, PDSEligibility, PDSWorkExperience, PDSLearningDevelopment, PDSFamily, PDSOtherInfo } from './pds.js';

export interface RawPDSInput {
  educations?: string | PDSEducation[];
  eligibilities?: string | PDSEligibility[];
  workExperiences?: string | PDSWorkExperience[];
  trainings?: string | PDSLearningDevelopment[];
  familyBackground?: string | PDSFamily[];
  otherInfo?: string | PDSOtherInfo[];
  [key: string]: unknown;
}

export interface MappedEducation extends PDSEducation {
    id?: number;
}

export interface MappedEligibility extends PDSEligibility {
    id?: number;
    name?: string; // Synonym for eligibilityName used in some parsers
    licenseNo?: string; // Synonym for licenseNumber
}

export interface MappedWorkExperience extends PDSWorkExperience {
    id?: number;
}

export interface MappedTraining extends PDSLearningDevelopment {
    id?: number;
}

export interface MappedFamily extends PDSFamily {
    id?: number;
}

export interface MappedOtherInfo extends PDSOtherInfo {
    id?: number;
}
