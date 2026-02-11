import { ApiResponse } from "./index";

export interface PerformanceCriteria {
    id: number;
    title: string;
    description: string;
    category: string;
    weight: number;
    max_score: number;
}

export interface ReviewItem {
    id: number;
    review_id: number;
    criteria_id: number | null;
    score: number;
    weight: number;
    max_score: number;
    comment: string | null;
    self_score: number | null;
    actual_accomplishments: string | null;
    q_score: number | null;
    e_score: number | null;
    t_score: number | null;
    category: string | null;
    criteria_title: string | null;
    criteria_description: string | null;
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
}

export interface ReviewCycle {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export type PerformanceApiResponse<T> = ApiResponse<T>;
