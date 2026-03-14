import { ApiResponse } from "./index";

export interface PerformanceCriteria {
    id: number;
    title: string;
    description: string;
    category: string;
    weight: number;
    maxScore: number;
    section?: string;
    ratingDefinition5?: string;
    ratingDefinition4?: string;
    ratingDefinition3?: string;
    ratingDefinition2?: string;
    ratingDefinition1?: string;
    evidenceRequirements?: string;
}

export type QETField = 'qScore' | 'eScore' | 'tScore';

export interface Assessment {
    id: string | number;
    title?: string;
    description?: string;
    badge?: string;
    badgeColor?: string;
    iconName?: string;
    value?: string;
    label?: string; // For backward compatibility with some components
    placeholder?: string; // For backward compatibility
}

export interface ReviewItem {
    id: string | number;
    reviewId: number;
    criteriaId: number | null;
    score: number;
    weight: number;
    maxScore: number;
    comment: string | null;
    selfScore: number | null;
    actualAccomplishments: string | null;
    qScore: number | string | null;
    eScore: number | string | null;
    tScore: number | string | null;
    category: string | null;
    criteriaTitle: string | null;
    criteriaDescription: string | null;
}

export interface AttendanceDetails {
    totalLates: number;
    totalUndertime: number;
    totalAbsences: number;
    totalLateMinutes: number;
    ratingDescription: string;
}

export interface InternalReview {
    id: number;
    employeeId: string;
    reviewerId: number;
    reviewCycleId: number;
    status: string;
    totalScore: string;
    overallFeedback: string | null;
    reviewerRemarks: string | null;
    reviewerRatingScore?: string | number | null;
    selfRatingScore?: string | number | null;
    employeeRemarks: string | null;
    additionalComments?: string;
    createdAt: string;
    updatedAt?: string;
    items?: ReviewItem[];
    attendanceDetails?: AttendanceDetails | null;
    violationCount?: number;
    // flattened names for frontend
    employeeFirstName?: string;
    employeeLastName?: string;
    employeeFirst?: string;
    employeeLast?: string;
    employeeDepartment?: string;
    employeeJobTitle?: string;
    employeePositionTitle?: string;
    reviewerFirstName?: string;
    reviewerLastName?: string;
    reviewerFirst?: string;
    reviewerLast?: string;
    // cycle / period info
    cycleTitle?: string;
    reviewPeriodStart?: string;
    reviewPeriodEnd?: string;
}

export interface ReviewCycle {
    id: number;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export type PerformanceApiResponse<T> = ApiResponse<T>;

export interface ReviewCyclesApiResponse {
    success: boolean;
    cycles: ReviewCycle[];
    message?: string;
}

export interface PerformanceCriteriaApiResponse {
    success: boolean;
    criteria: PerformanceCriteria[];
    message?: string;
}

export interface ReviewApiResponse {
    success: boolean;
    review: InternalReview;
    message?: string;
}

