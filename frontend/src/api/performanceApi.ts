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
  try {
    const response = await axios.get('/performance/summary');
    return response.data;
  } catch (error) {
    if (error instanceof Error) {
        console.error('Fetch Evaluation Summary Error:', error.message);
    }
    throw error;
  }
};

export const fetchRatingDistribution = async (): Promise<ApiResponse<Record<string, unknown>>> => {
  try {
    const response = await axios.get('/performance/rating-distribution');
    return response.data;
  } catch (error: unknown) {
    console.error('Fetch Rating Distribution Error:', error);
    throw error;
  }
};

export const fetchReviewCycles = async (): Promise<ReviewCyclesApiResponse> => {
  try {
    const response = await axios.get('/performance/cycles');
    return response.data;
  } catch (error: unknown) {
    console.error('Fetch Review Cycles Error:', error);
    throw error;
  }
};

export const fetchReviews = async (filters: Record<string, unknown> = {}): Promise<{ success: boolean; message?: string; reviews: InternalReview[] }> => {
  try {
    const params = new URLSearchParams(filters as Record<string, string>).toString();
    const response = await axios.get(`/performance/reviews?${params}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Fetch Reviews Error:', error);
    throw error;
  }
};

export const getReview = async (id: string | number): Promise<ReviewApiResponse> => {
  try {
    const response = await axios.get(`/performance/reviews/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Get Review Error:', error);
    throw error;
  }
};

export const createReview = async (data: Partial<InternalReview>): Promise<ApiResponse<{ success: boolean; reviewId: number }>> => {
  try {
    const response = await axios.post('/performance/reviews', data);
    return response.data;
  } catch (error: unknown) {
    console.error('Create Review Error:', error);
    throw error;
  }
};

export const updateReview = async (id: string | number, data: Partial<InternalReview>): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.put(`/performance/reviews/${id}`, data);
    return response.data;
  } catch (error: unknown) {
    console.error('Update Review Error:', error);
    throw error;
  }
};

export const submitReview = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.post(`/performance/reviews/${id}/submit`);
    return response.data;
  } catch (error: unknown) {
    console.error('Submit Review Error:', error);
    throw error;
  }
};

export const deleteReview = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.delete(`/performance/reviews/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Delete Review Error:', error);
    throw error;
  }
};

export const acknowledgeReview = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.post(`/performance/reviews/${id}/acknowledge`);
    return response.data;
  } catch (error: unknown) {
    console.error('Acknowledge Review Error:', error);
    throw error;
  }
};

export const fetchReviewById = getReview;

export const fetchCriteria = async (): Promise<PerformanceCriteriaApiResponse> => {
  try {
    const response = await axios.get('/performance/criteria');
    return response.data;
  } catch (error: unknown) {
    console.error('Fetch Criteria Error:', error);
    throw error;
  }
};

export const addCriteria = async (data: Partial<PerformanceCriteria>): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.post('/performance/criteria', data);
    return response.data;
  } catch (error: unknown) {
    console.error('Add Criteria Error:', error);
    throw error;
  }
};

export const updateCriteria = async (id: string | number, data: Partial<PerformanceCriteria>): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.put(`/performance/criteria/${id}`, data);
    return response.data;
  } catch (error: unknown) {
    console.error('Update Criteria Error:', error);
    throw error;
  }
};

export const deleteCriteria = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.delete(`/performance/criteria/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Delete Criteria Error:', error);
    throw error;
  }
};

export const createReviewCycle = async (data: Partial<ReviewCycle>): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.post('/performance/cycles', data);
    return response.data;
  } catch (error: unknown) {
    console.error('Create Review Cycle Error:', error);
    throw error;
  }
};

export const updateReviewCycle = async (id: string | number, data: Partial<ReviewCycle>): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.put(`/performance/cycles/${id}`, data);
    return response.data;
  } catch (error: unknown) {
    console.error('Update Review Cycle Error:', error);
    throw error;
  }
};

export const deleteReviewCycle = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.delete(`/performance/cycles/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Delete Review Cycle Error:', error);
    throw error;
  }
};


// #CSC-COMPLIANT PERFORMANCE EVALUATION APIs

// Submit employee self-rating
export const submitSelfRating = async (id: string | number, data: Record<string, unknown>): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.post(`/performance/reviews/${id}/self-rating`, data);
    return response.data;
  } catch (error: unknown) {
    console.error('Submit Self Rating Error:', error);
    throw error;
  }
};

// Submit supervisor rating
export const submitSupervisorRating = async (id: string | number, data: Record<string, unknown>): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.post(`/performance/reviews/${id}/supervisor-rating`, data);
    return response.data;
  } catch (error: unknown) {
    console.error('Submit Supervisor Rating Error:', error);
    throw error;
  }
};

// Approve review (Head of Office)
export const approveReview = async (id: string | number, data: Record<string, unknown>): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.post(`/performance/reviews/${id}/approve`, data);
    return response.data;
  } catch (error: unknown) {
    console.error('Approve Review Error:', error);
    throw error;
  }
};

// Finalize review
export const finalizeReview = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.post(`/performance/reviews/${id}/finalize`);
    return response.data;
  } catch (error: unknown) {
    console.error('Finalize Review Error:', error);
    throw error;
  }
};

// Disagree with rating
export const disagreeWithRating = async (id: string | number, remarks: string): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.post(`/performance/reviews/${id}/disagree`, { disagree_remarks: remarks });
    return response.data;
  } catch (error: unknown) {
    console.error('Disagree With Rating Error:', error);
    throw error;
  }
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
      const response = await axios.get(`/performance/reviews?employee_id=${employeeId}`);
      return { success: true, goals: response.data.reviews || [] };
    } catch (error: unknown) {
      console.error('Fetch Employee Goals Error:', error);
      return { success: false, goals: [] };
    }
};


// Item Management (Immediate)
export const addItem = async (data: Partial<ReviewItem>): Promise<ApiResponse<{ success: boolean; itemId: number }>> => {
  try {
    const response = await axios.post('/performance/items', data);
    return response.data;
  } catch (error: unknown) {
    console.error('Add Item Error:', error);
    throw error;
  }
};

export const updateItem = async (id: string | number, data: Partial<ReviewItem>): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.put(`/performance/items/${id}`, data);
    return response.data;
  } catch (error: unknown) {
    console.error('Update Item Error:', error);
    throw error;
  }
};

export const deleteItem = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
  try {
    const response = await axios.delete(`/performance/items/${id}`);
    return response.data;
  } catch (error: unknown) {
    console.error('Delete Item Error:', error);
    throw error;
  }
};
