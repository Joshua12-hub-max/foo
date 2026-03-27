import { EDUCATION_LEVELS } from "@/schemas/recruitment";
import { EMPLOYEE_ROLES } from "./statusConstants";

export const GENDER_OPTIONS = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" }
] as const;

export const CIVIL_STATUS_OPTIONS = [
    { value: "Single", label: "Single" },
    { value: "Married", label: "Married" },
    { value: "Widowed", label: "Widowed" },
    { value: "Separated", label: "Separated" },
    { value: "Annulled", label: "Annulled" }
] as const;

export const BLOOD_TYPE_OPTIONS = [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" }
] as const;

export const EDUCATION_LEVEL_OPTIONS = EDUCATION_LEVELS.map(level => ({
    value: level,
    label: level
})) as { value: typeof EDUCATION_LEVELS[number]; label: string }[];

/** PDS Education enum — matches pds_education.level DB column exactly */
export const PDS_EDUCATION_LEVELS = ['Elementary', 'Secondary', 'Vocational', 'College', 'Graduate Studies'] as const;
export type PdsEducationLevel = typeof PDS_EDUCATION_LEVELS[number];

export const PDS_EDUCATION_LEVEL_OPTIONS = PDS_EDUCATION_LEVELS.map(level => ({
    value: level,
    label: level
})) as { value: PdsEducationLevel; label: string }[];

export const ELIGIBILITY_RECRUITMENT_OPTIONS = [
    { value: "none", label: "Not Applicable / None" },
    { value: "csc_prof", label: "Career Service (Professional)" },
    { value: "csc_sub", label: "Career Service (Sub-Professional)" },
    { value: "ra_1080", label: "Board / Bar (RA 1080)" },
    { value: "special_laws", label: "Special Laws (CES/CSEE)" },
    { value: "drivers_license", label: "Driver's License" },
    { value: "tesda", label: "Skill / TESDA Certificate" },
    { value: "nbi_clearance", label: "NBI Clearance" },
    { value: "others", label: "Other Eligibility / Certification" }
] as const;

export const APPOINTMENT_TYPE_OPTIONS = [
    { value: 'Permanent', label: 'Permanent' },
    { value: 'Contractual', label: 'Contractual' },
    { value: 'Casual', label: 'Casual' },
    { value: 'Job Order', label: 'Job Order' },
    { value: 'Coterminous', label: 'Coterminous' },
    { value: 'Temporary', label: 'Temporary' },
    { value: 'Contract of Service', label: 'Contract of Service' }
] as const;

export const DUTY_TYPE_OPTIONS = [
    { value: 'Standard', label: 'Standard' },
    { value: 'Irregular', label: 'Irregular' }
] as const;

export const EMPLOYMENT_TYPE_OPTIONS = [
    { value: 'Probationary', label: 'Probationary' },
    { value: 'Regular', label: 'Regular' },
    { value: 'Job Order', label: 'Job Order' },
    { value: 'Contractual', label: 'Contractual' }
] as const;

export const EMPLOYMENT_STATUS_OPTIONS = [
    { value: 'Active', label: 'Active' },
    { value: 'Probationary', label: 'Probationary' },
    { value: 'On Leave', label: 'On Leave' },
    { value: 'Suspended', label: 'Suspended' },
    { value: 'Verbal Warning', label: 'Verbal Warning' },
    { value: 'Written Warning', label: 'Written Warning' },
    { value: 'Show Cause', label: 'Show Cause' },
    { value: 'Terminated', label: 'Terminated' },
    { value: 'Resigned', label: 'Resigned' }
] as const;

export const NATIONALITY_OPTIONS = [
    { value: 'Filipino', label: 'Filipino' },
    { value: 'American', label: 'American' },
    { value: 'Chinese', label: 'Chinese' },
    { value: 'Japanese', label: 'Japanese' },
    { value: 'Korean', label: 'Korean' },
    { value: 'Indian', label: 'Indian' },
    { value: 'British', label: 'British' },
    { value: 'Australian', label: 'Australian' },
    { value: 'Canadian', label: 'Canadian' },
    { value: 'Other', label: 'Other' }
] as const;

export const ELIGIBILITY_TYPE_OPTIONS = [
    { value: 'CS Professional', label: 'CS Professional' },
    { value: 'CS Sub-Professional', label: 'CS Sub-Professional' },
    { value: 'RA 1080 (CPA)', label: 'RA 1080 (CPA)' },
    { value: 'RA 1080 (LET)', label: 'RA 1080 (LET)' },
    { value: 'RA 544 (CE)', label: 'RA 544 (Registered Civil Engineer)' },
    { value: 'RA 382 (ME)', label: 'RA 382 (Registered Mechanical Engineer)' },
    { value: 'RA 9292 (EE)', label: 'RA 9292 (Registered Electrical Engineer)' },
    { value: 'Bar Passer', label: 'Bar Passer' },
    { value: 'PRC License', label: 'PRC License (Other)' },
    { value: 'None', label: 'None Required' }
] as const;

export const ROLE_OPTIONS = Object.values(EMPLOYEE_ROLES).map(role => ({
    value: role,
    label: role
})) as { value: string; label: string }[];
