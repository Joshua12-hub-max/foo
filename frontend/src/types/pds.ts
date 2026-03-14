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
