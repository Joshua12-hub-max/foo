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

export type QETField = 'q_score' | 'e_score' | 't_score';

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
    review_id: number;
    criteria_id: number | null;
    score: number;
    weight: number;
    max_score: number;
    comment: string | null;
    self_score: number | null;
    actual_accomplishments: string | null;
    q_score: number | string | null;
    e_score: number | string | null;
    t_score: number | string | null;
    category: string | null;
    criteria_title: string | null;
    criteria_description: string | null;
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
    employee_id: number;
    reviewer_id: number;
    review_cycle_id: number;
    status: string;
    total_score: string;
    overall_feedback: string | null;
    supervisor_remarks: string | null;
    employee_remarks: string | null;
    additional_comments?: string;
    created_at: string;
    items?: ReviewItem[];
    attendance_details?: AttendanceDetails | null;
    violation_count?: number;
    // flattened names for frontend (standardizing on both variants for compatibility)
    employee_first_name?: string;
    employee_last_name?: string;
    employee_first?: string;
    employee_last?: string;
    employee_department?: string;
    employee_job_title?: string;
    employee_position_title?: string;
    reviewer_first_name?: string;
    reviewer_last_name?: string;
    reviewer_first?: string;
    reviewer_last?: string;
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

