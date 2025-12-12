import axios from './axios';

export const fetchEvaluationSummary = async () => {
  const response = await axios.get('/performance/summary');
  return response.data;
};

export const fetchRatingDistribution = async () => {
  const response = await axios.get('/performance/rating-distribution');
  return response.data;
};

export const fetchReviewCycles = async () => {
  const response = await axios.get('/performance/cycles');
  return response.data;
};

export const fetchReviews = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const response = await axios.get(`/performance/reviews?${params}`);
  return response.data;
};

export const getReview = async (id) => {
  const response = await axios.get(`/performance/reviews/${id}`);
  return response.data;
};

export const createReview = async (data) => {
  const response = await axios.post('/performance/reviews', data);
  return response.data;
};

export const updateReview = async (id, data) => {
  const response = await axios.put(`/performance/reviews/${id}`, data);
  return response.data;
};

export const submitReview = async (id) => {
  const response = await axios.post(`/performance/reviews/${id}/submit`);
  return response.data;
};

export const deleteReview = async (id) => {
  const response = await axios.delete(`/performance/reviews/${id}`);
  return response.data;
};

export const acknowledgeReview = async (id) => {
  const response = await axios.post(`/performance/reviews/${id}/acknowledge`);
  return response.data;
};

export const fetchReviewById = getReview;

export const fetchCriteria = async () => {
    const response = await axios.get('/performance/criteria');
    return response.data;
};

export const addCriteria = async (data) => {
    const response = await axios.post('/performance/criteria', data);
    return response.data;
};

export const updateCriteria = async (id, data) => {
    const response = await axios.put(`/performance/criteria/${id}`, data);
    return response.data;
};

export const deleteCriteria = async (id) => {
    const response = await axios.delete(`/performance/criteria/${id}`);
    return response.data;
};

export const createReviewCycle = async (data) => {
    const response = await axios.post('/performance/cycles', data);
    return response.data;
};

export const updateReviewCycle = async (id, data) => {
    const response = await axios.put(`/performance/cycles/${id}`, data);
    return response.data;
};

export const deleteReviewCycle = async (id) => {
    const response = await axios.delete(`/performance/cycles/${id}`);
    return response.data;
};


// #CSC-COMPLIANT PERFORMANCE EVALUATION APIs

// Get employee's pending reviews for self-rating
export const getMyPendingReviews = async () => {
    const response = await axios.get('/performance/my-reviews');
    return response.data;
};

// Submit employee self-rating
export const submitSelfRating = async (id, data) => {
    const response = await axios.post(`/performance/reviews/${id}/self-rating`, data);
    return response.data;
};

// Submit supervisor rating
export const submitSupervisorRating = async (id, data) => {
    const response = await axios.post(`/performance/reviews/${id}/supervisor-rating`, data);
    return response.data;
};

// Approve review (Head of Office)
export const approveReview = async (id, data) => {
    const response = await axios.post(`/performance/reviews/${id}/approve`, data);
    return response.data;
};

// Finalize review
export const finalizeReview = async (id) => {
    const response = await axios.post(`/performance/reviews/${id}/finalize`);
    return response.data;
};

// Get review audit history
export const getReviewHistory = async (id) => {
    const response = await axios.get(`/performance/reviews/${id}/history`);
    return response.data;
};

// Disagree with rating
export const disagreeWithRating = async (id, remarks) => {
    const response = await axios.post(`/performance/reviews/${id}/disagree`, { disagree_remarks: remarks });
    return response.data;
};

// Helper: Get adjectival rating from numeric score
export const getAdjectivalRating = (score) => {
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