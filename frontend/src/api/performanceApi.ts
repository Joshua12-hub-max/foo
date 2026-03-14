import axios from './axios';
import { ApiResponse } from '@/types';
import { 
  InternalReview, 
  ReviewCycle, 
  PerformanceCriteria, 
  ReviewItem,
  ReviewCyclesApiResponse,
  PerformanceCriteriaApiResponse,
  ReviewApiResponse
} from '@/types/performance';

export interface InternalReviewListResponse {
    success: boolean;
    message?: string;
    reviews: InternalReview[];
}

export interface EvaluationSummaryResponse {
  success: boolean;
  message?: string;
  employees?: InternalReview[];
  stats?: Record<string, number>;
  data?: {
    employees?: InternalReview[];
    stats?: Record<string, number>;
  };
}

export const fetchEvaluationSummary = async (): Promise<EvaluationSummaryResponse> => {
    const response = await axios.get<EvaluationSummaryResponse>('/performance/summary');
    return response.data;
};

export const fetchRatingDistribution = async (): Promise<ApiResponse<Record<string, unknown>>> => {
    const response = await axios.get<ApiResponse<Record<string, unknown>>>('/performance/rating-distribution');
    return response.data;
};

export const fetchReviewCycles = async (): Promise<ReviewCyclesApiResponse> => {
    const response = await axios.get<ReviewCyclesApiResponse>('/performance/cycles');
    return response.data;
};

// 1. Fetch all reviews
export const fetchReviews = async (params?: Record<string, string | number>): Promise<InternalReviewListResponse> => {
  const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  const response = await axios.get<InternalReviewListResponse>(`/performance/reviews${query}`);
  return response.data;
};

// 2. Fetch specific review
export const fetchReviewById = async (id: string | number): Promise<ReviewApiResponse> => {
  const response = await axios.get<ReviewApiResponse>(`/performance/reviews/${id}`);
  return response.data;
};

// 3. Create a review draft
export const createReview = async (reviewData: Partial<InternalReview>): Promise<ApiResponse<{ reviewId: number | string }>> => {
  const response = await axios.post<ApiResponse<{ reviewId: number | string }>>('/performance/reviews', reviewData);
  return response.data;
};

// 4. Update a review (Draft/Ongoing)
export const updateReview = async (id: string | number, reviewData: Partial<InternalReview>): Promise<ApiResponse<{ success: boolean; totalScore?: string | number }>> => {
  const response = await axios.put<ApiResponse<{ success: boolean; totalScore?: string | number }>>(`/performance/reviews/${id}`, reviewData);
  return response.data;
};

// 5. Submit Self-Rating
export const submitSelfRating = async (id: string | number, data: { items: Partial<ReviewItem>[]; employeeRemarks?: string; isDraft?: boolean }): Promise<ApiResponse<{ selfRatingScore?: string | number }>> => {
  const response = await axios.post<ApiResponse<{ selfRatingScore?: string | number }>>(`/performance/reviews/${id}/self-rate`, data);
  return response.data;
};

// 6. Submit Reviewer Rating
export const submitReviewerRating = async (id: string | number, data: { items: Partial<ReviewItem>[]; reviewerRemarks?: string; overallFeedback?: string }): Promise<ApiResponse<{ reviewerRatingScore?: string | number }>> => {
  const response = await axios.post<ApiResponse<{ reviewerRatingScore?: string | number }>>(`/performance/reviews/${id}/submit`, data);
  return response.data;
};

export const deleteReview = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.delete<ApiResponse<{ success: boolean }>>(`/performance/reviews/${id}`);
    return response.data;
};

export const acknowledgeReview = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.post<ApiResponse<{ success: boolean }>>(`/performance/reviews/${id}/acknowledge`);
    return response.data;
};

export const fetchCriteria = async (): Promise<PerformanceCriteriaApiResponse> => {
    const response = await axios.get<PerformanceCriteriaApiResponse>('/performance/criteria');
    return response.data;
};

export const addCriteria = async (data: Partial<PerformanceCriteria>): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.post<ApiResponse<{ success: boolean }>>('/performance/criteria', data);
    return response.data;
};

export const updateCriteria = async (id: string | number, data: Partial<PerformanceCriteria>): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.put<ApiResponse<{ success: boolean }>>(`/performance/criteria/${id}`, data);
    return response.data;
};

export const deleteCriteria = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.delete<ApiResponse<{ success: boolean }>>(`/performance/criteria/${id}`);
    return response.data;
};

export const createReviewCycle = async (data: Partial<ReviewCycle>): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.post<ApiResponse<{ success: boolean }>>('/performance/cycles', data);
    return response.data;
};

export const updateReviewCycle = async (id: string | number, data: Partial<ReviewCycle>): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.put<ApiResponse<{ success: boolean }>>(`/performance/cycles/${id}`, data);
    return response.data;
};

export const deleteReviewCycle = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.delete<ApiResponse<{ success: boolean }>>(`/performance/cycles/${id}`);
    return response.data;
};


// #CSC-COMPLIANT PERFORMANCE EVALUATION APIs

// Approve review (Head of Office)
export const approveReview = async (id: string | number, data: Record<string, unknown>): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.post<ApiResponse<{ success: boolean }>>(`/performance/reviews/${id}/approve`, data);
    return response.data;
};

// Finalize review
export const finalizeReview = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.post<ApiResponse<{ success: boolean }>>(`/performance/reviews/${id}/finalize`);
    return response.data;
};

// Disagree with rating
export const disagreeWithRating = async (id: string | number, remarks: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.post<ApiResponse<{ success: boolean }>>(`/performance/reviews/${id}/disagree`, { disagreeRemarks: remarks });
    return response.data;
};

// Helper: Get adjectival rating from numeric score
export const getAdjectivalRating = (score: number) => {
    if (score >= 4.5) return { rating: "Outstanding", color: "text-green-700 bg-green-100" };
    if (score >= 3.5) return { rating: "Very Satisfactory", color: "text-blue-700 bg-blue-100" };
    if (score >= 2.5) return { rating: "Satisfactory", color: "text-yellow-700 bg-yellow-100" };
    if (score >= 1.5) return { rating: "Unsatisfactory", color: "text-orange-700 bg-orange-100" };
    return { rating: "Poor", color: "text-red-700 bg-red-100" };
};

// CSC Rating Scale Reference
export const CSC_RATING_SCALE = [
    { score: 5, label: "Outstanding", description: "Extraordinary achievement, exceptional mastery in all areas." },
    { score: 4, label: "Very Satisfactory", description: "Exceeded expectations, all goals achieved above standards." },
    { score: 3, label: "Satisfactory", description: "Met expectations, critical goals were achieved." },
    { score: 2, label: "Unsatisfactory", description: "Failed to meet expectations, critical goals not met." },
    { score: 1, label: "Poor", description: "Consistently below expectations, significant improvement needed." }
];

// Fetch goals for a specific employee
export const fetchEmployeeGoals = async (employeeId: string | number): Promise<{ success: boolean; goals: InternalReview[] }> => {
    try {
      // Reusing reviews endpoint filtering by employee
      const response = await axios.get<{ success: boolean; reviews?: InternalReview[] }>(`/performance/reviews?employeeId=${employeeId}`);
      return { success: true, goals: response.data.reviews || [] };
    } catch (error: unknown) {
      console.error('Fetch Employee Goals Error:', error);
      return { success: false, goals: [] };
    }
};


// Item Management (Immediate)
export const addItem = async (data: Partial<ReviewItem>): Promise<ApiResponse<{ success: boolean; itemId: number }>> => {
    const response = await axios.post<ApiResponse<{ success: boolean; itemId: number }>>('/performance/items', data);
    return response.data;
};

export const updateItem = async (id: string | number, data: Partial<ReviewItem>): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.put<ApiResponse<{ success: boolean }>>(`/performance/items/${id}`, data);
    return response.data;
};

export const deleteItem = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.delete<ApiResponse<{ success: boolean }>>(`/performance/items/${id}`);
    return response.data;
};
