import axios from './axios';

//SPMS API

export const fetchCycles = async () => {
  try {
    const response = await axios.get('/spms/cycles');
    return response.data;
  } catch (error) {
    console.error('Fetch cycles error:', error);
    throw error;
  }
};

export const fetchCycle = async (id) => {
  try {
    const response = await axios.get(`/spms/cycles/${id}`);
    return response.data;
  } catch (error) {
    console.error('Fetch cycle error:', error);
    throw error;
  }
};

export const createCycle = async (data) => {
  try {
    const response = await axios.post('/spms/cycles', data);
    return response.data;
  } catch (error) {
    console.error('Create cycle error:', error);
    throw error;
  }
};

export const updateCycle = async (id, data) => {
  try {
    const response = await axios.put(`/spms/cycles/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Update cycle error:', error);
    throw error;
  }
};

export const deleteCycle = async (id) => {
  try {
    const response = await axios.delete(`/spms/cycles/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete cycle error:', error);
    throw error;
  }
};

// MFO & KRA MANAGEMENT

export const fetchMFOs = async (department = null) => {
  try {
    const params = department ? `?department=${department}` : '';
    const response = await axios.get(`/spms/mfo${params}`);
    return response.data;
  } catch (error) {
    console.error('Fetch MFOs error:', error);
    throw error;
  }
};

export const createMFO = async (data) => {
  try {
    const response = await axios.post('/spms/mfo', data);
    return response.data;
  } catch (error) {
    console.error('Create MFO error:', error);
    throw error;
  }
};

export const updateMFO = async (id, data) => {
  try {
    const response = await axios.put(`/spms/mfo/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Update MFO error:', error);
    throw error;
  }
};

export const deleteMFO = async (id) => {
  try {
    const response = await axios.delete(`/spms/mfo/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete MFO error:', error);
    throw error;
  }
};

export const fetchKRAs = async (mfoId = null) => {
  try {
    const params = mfoId ? `?mfo_id=${mfoId}` : '';
    const response = await axios.get(`/spms/kra${params}`);
    return response.data;
  } catch (error) {
    console.error('Fetch KRAs error:', error);
    throw error;
  }
};

export const createKRA = async (data) => {
  try {
    const response = await axios.post('/spms/kra', data);
    return response.data;
  } catch (error) {
    console.error('Create KRA error:', error);
    throw error;
  }
};

export const updateKRA = async (id, data) => {
  try {
    const response = await axios.put(`/spms/kra/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Update KRA error:', error);
    throw error;
  }
};

export const deleteKRA = async (id) => {
  try {
    const response = await axios.delete(`/spms/kra/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete KRA error:', error);
    throw error;
  }
};

// =====================================================
// COMPETENCIES MANAGEMENT
// =====================================================

export const fetchCompetencies = async () => {
  try {
    const response = await axios.get('/spms/competencies');
    return response.data;
  } catch (error) {
    console.error('Fetch competencies error:', error);
    throw error;
  }
};

export const createCompetency = async (data) => {
  try {
    const response = await axios.post('/spms/competencies', data);
    return response.data;
  } catch (error) {
    console.error('Create competency error:', error);
    throw error;
  }
};

export const updateCompetency = async (id, data) => {
  try {
    const response = await axios.put(`/spms/competencies/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Update competency error:', error);
    throw error;
  }
};

// =====================================================
// IPCR MANAGEMENT
// =====================================================

export const fetchIPCRs = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`/spms/ipcr?${params}`);
    return response.data;
  } catch (error) {
    console.error('Fetch IPCRs error:', error);
    throw error;
  }
};

export const fetchIPCR = async (id) => {
  try {
    const response = await axios.get(`/spms/ipcr/${id}`);
    return response.data;
  } catch (error) {
    console.error('Fetch IPCR error:', error);
    throw error;
  }
};

export const createIPCR = async (data) => {
  try {
    const response = await axios.post('/spms/ipcr', data);
    return response.data;
  } catch (error) {
    console.error('Create IPCR error:', error);
    throw error;
  }
};

export const updateIPCR = async (id, data) => {
  try {
    const response = await axios.put(`/spms/ipcr/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Update IPCR error:', error);
    throw error;
  }
};

export const deleteIPCR = async (id) => {
  try {
    const response = await axios.delete(`/spms/ipcr/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete IPCR error:', error);
    throw error;
  }
};

// IPCR Items
export const addIPCRItem = async (ipcrId, data) => {
  try {
    const response = await axios.post(`/spms/ipcr/${ipcrId}/items`, data);
    return response.data;
  } catch (error) {
    console.error('Add IPCR item error:', error);
    throw error;
  }
};

export const updateIPCRItem = async (itemId, data) => {
  try {
    const response = await axios.put(`/spms/ipcr/items/${itemId}`, data);
    return response.data;
  } catch (error) {
    console.error('Update IPCR item error:', error);
    throw error;
  }
};

export const deleteIPCRItem = async (itemId) => {
  try {
    const response = await axios.delete(`/spms/ipcr/items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Delete IPCR item error:', error);
    throw error;
  }
};

// IPCR Workflow
export const commitIPCR = async (id) => {
  try {
    const response = await axios.post(`/spms/ipcr/${id}/commit`);
    return response.data;
  } catch (error) {
    console.error('Commit IPCR error:', error);
    throw error;
  }
};

export const submitIPCRForRating = async (id) => {
  try {
    const response = await axios.post(`/spms/ipcr/${id}/submit-for-rating`);
    return response.data;
  } catch (error) {
    console.error('Submit IPCR for rating error:', error);
    throw error;
  }
};

export const rateIPCR = async (id, data) => {
  try {
    const response = await axios.post(`/spms/ipcr/${id}/rate`, data);
    return response.data;
  } catch (error) {
    console.error('Rate IPCR error:', error);
    throw error;
  }
};

export const acknowledgeIPCR = async (id, data) => {
  try {
    const response = await axios.post(`/spms/ipcr/${id}/acknowledge`, data);
    return response.data;
  } catch (error) {
    console.error('Acknowledge IPCR error:', error);
    throw error;
  }
};

export const approveIPCR = async (id, data) => {
  try {
    const response = await axios.post(`/spms/ipcr/${id}/approve`, data);
    return response.data;
  } catch (error) {
    console.error('Approve IPCR error:', error);
    throw error;
  }
};

export const finalizeIPCR = async (id) => {
  try {
    const response = await axios.post(`/spms/ipcr/${id}/finalize`);
    return response.data;
  } catch (error) {
    console.error('Finalize IPCR error:', error);
    throw error;
  }
};

// Competency Ratings
export const updateCompetencyRatings = async (id, data) => {
  try {
    const response = await axios.put(`/spms/ipcr/${id}/competencies`, data);
    return response.data;
  } catch (error) {
    console.error('Update competency ratings error:', error);
    throw error;
  }
};

// Dashboard & Reports
export const fetchSPMSDashboard = async () => {
  try {
    const response = await axios.get('/spms/dashboard');
    return response.data;
  } catch (error) {
    console.error('Fetch SPMS dashboard error:', error);
    throw error;
  }
};

export const fetchDepartmentReport = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`/spms/reports/department?${params}`);
    return response.data;
  } catch (error) {
    console.error('Fetch department report error:', error);
    throw error;
  }
};

// =====================================================
// COACHING LOGS API
// =====================================================

export const fetchCoachingLogs = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`/spms/coaching?${params}`);
    return response.data;
  } catch (error) {
    console.error('Fetch coaching logs error:', error);
    throw error;
  }
};

export const fetchCoachingLog = async (id) => {
  try {
    const response = await axios.get(`/spms/coaching/${id}`);
    return response.data;
  } catch (error) {
    console.error('Fetch coaching log error:', error);
    throw error;
  }
};

export const fetchMyCoachingSessions = async () => {
  try {
    const response = await axios.get('/spms/coaching/my-sessions');
    return response.data;
  } catch (error) {
    console.error('Fetch my coaching sessions error:', error);
    throw error;
  }
};

export const fetchCoachingStats = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`/spms/coaching/stats?${params}`);
    return response.data;
  } catch (error) {
    console.error('Fetch coaching stats error:', error);
    throw error;
  }
};

export const createCoachingLog = async (data) => {
  try {
    const response = await axios.post('/spms/coaching', data);
    return response.data;
  } catch (error) {
    console.error('Create coaching log error:', error);
    throw error;
  }
};

export const updateCoachingLog = async (id, data) => {
  try {
    const response = await axios.put(`/spms/coaching/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Update coaching log error:', error);
    throw error;
  }
};

export const completeCoachingSession = async (id, data) => {
  try {
    const response = await axios.post(`/spms/coaching/${id}/complete`, data);
    return response.data;
  } catch (error) {
    console.error('Complete coaching session error:', error);
    throw error;
  }
};

export const deleteCoachingLog = async (id) => {
  try {
    const response = await axios.delete(`/spms/coaching/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete coaching log error:', error);
    throw error;
  }
};

// =====================================================
// DEVELOPMENT PLANS API
// =====================================================

export const fetchDevelopmentPlans = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`/spms/development-plans?${params}`);
    return response.data;
  } catch (error) {
    console.error('Fetch development plans error:', error);
    throw error;
  }
};

export const fetchDevelopmentPlan = async (id) => {
  try {
    const response = await axios.get(`/spms/development-plans/${id}`);
    return response.data;
  } catch (error) {
    console.error('Fetch development plan error:', error);
    throw error;
  }
};

export const fetchMyDevelopmentPlans = async () => {
  try {
    const response = await axios.get('/spms/development-plans/my-plans');
    return response.data;
  } catch (error) {
    console.error('Fetch my development plans error:', error);
    throw error;
  }
};

export const fetchDevelopmentPlanStats = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`/spms/development-plans/stats?${params}`);
    return response.data;
  } catch (error) {
    console.error('Fetch development plan stats error:', error);
    throw error;
  }
};

export const createDevelopmentPlan = async (data) => {
  try {
    const response = await axios.post('/spms/development-plans', data);
    return response.data;
  } catch (error) {
    console.error('Create development plan error:', error);
    throw error;
  }
};

export const updateDevelopmentPlan = async (id, data) => {
  try {
    const response = await axios.put(`/spms/development-plans/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Update development plan error:', error);
    throw error;
  }
};

export const approveDevelopmentPlan = async (id) => {
  try {
    const response = await axios.post(`/spms/development-plans/${id}/approve`);
    return response.data;
  } catch (error) {
    console.error('Approve development plan error:', error);
    throw error;
  }
};

export const completeDevelopmentPlan = async (id, data) => {
  try {
    const response = await axios.post(`/spms/development-plans/${id}/complete`, data);
    return response.data;
  } catch (error) {
    console.error('Complete development plan error:', error);
    throw error;
  }
};

export const updateDevelopmentPlanProgress = async (id, data) => {
  try {
    const response = await axios.put(`/spms/development-plans/${id}/progress`, data);
    return response.data;
  } catch (error) {
    console.error('Update development plan progress error:', error);
    throw error;
  }
};

// =====================================================
// TRAINING NEEDS API
// =====================================================

export const fetchTrainingNeeds = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`/spms/training-needs?${params}`);
    return response.data;
  } catch (error) {
    console.error('Fetch training needs error:', error);
    throw error;
  }
};

export const fetchTrainingNeed = async (id) => {
  try {
    const response = await axios.get(`/spms/training-needs/${id}`);
    return response.data;
  } catch (error) {
    console.error('Fetch training need error:', error);
    throw error;
  }
};

export const fetchMyTrainingNeeds = async () => {
  try {
    const response = await axios.get('/spms/training-needs/my-trainings');
    return response.data;
  } catch (error) {
    console.error('Fetch my training needs error:', error);
    throw error;
  }
};

export const fetchTrainingStats = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString();
    const response = await axios.get(`/spms/training-needs/stats?${params}`);
    return response.data;
  } catch (error) {
    console.error('Fetch training stats error:', error);
    throw error;
  }
};

export const createTrainingNeed = async (data) => {
  try {
    const response = await axios.post('/spms/training-needs', data);
    return response.data;
  } catch (error) {
    console.error('Create training need error:', error);
    throw error;
  }
};

export const updateTrainingNeed = async (id, data) => {
  try {
    const response = await axios.put(`/spms/training-needs/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Update training need error:', error);
    throw error;
  }
};

export const approveTrainingNeed = async (id) => {
  try {
    const response = await axios.post(`/spms/training-needs/${id}/approve`);
    return response.data;
  } catch (error) {
    console.error('Approve training need error:', error);
    throw error;
  }
};

export const scheduleTraining = async (id, data) => {
  try {
    const response = await axios.post(`/spms/training-needs/${id}/schedule`, data);
    return response.data;
  } catch (error) {
    console.error('Schedule training error:', error);
    throw error;
  }
};

export const completeTraining = async (id, data) => {
  try {
    const response = await axios.post(`/spms/training-needs/${id}/complete`, data);
    return response.data;
  } catch (error) {
    console.error('Complete training error:', error);
    throw error;
  }
};

export const deleteTrainingNeed = async (id) => {
  try {
    const response = await axios.delete(`/spms/training-needs/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete training need error:', error);
    throw error;
  }
};

// =====================================================
// MID-YEAR REVIEW API
// =====================================================

export const fetchMidYearReview = async (ipcrId) => {
  try {
    const response = await axios.get(`/spms/ipcr/${ipcrId}/mid-year`);
    return response.data;
  } catch (error) {
    console.error('Fetch mid-year review error:', error);
    throw error;
  }
};

export const submitMidYearReview = async (ipcrId, data) => {
  try {
    const response = await axios.post(`/spms/ipcr/${ipcrId}/mid-year`, data);
    return response.data;
  } catch (error) {
    console.error('Submit mid-year review error:', error);
    throw error;
  }
};

// =====================================================
// EMPLOYEES NEEDING PDP
// =====================================================

export const fetchEmployeesNeedingPDP = async (cycleId = null) => {
  try {
    const params = cycleId ? `?cycle_id=${cycleId}` : '';
    const response = await axios.get(`/spms/employees-needing-pdp${params}`);
    return response.data;
  } catch (error) {
    console.error('Fetch employees needing PDP error:', error);
    throw error;
  }
};

// =====================================================
// MFO BUDGET API
// =====================================================

export const updateMFOBudget = async (id, data) => {
  try {
    const response = await axios.put(`/spms/mfo/${id}/budget`, data);
    return response.data;
  } catch (error) {
    console.error('Update MFO budget error:', error);
    throw error;
  }
};

//HELPER: Rating scales
export const COACHING_TYPES = [
  { value: 'Monthly Check-in', label: 'Monthly Check-in' },
  { value: 'Performance Coaching', label: 'Performance Coaching' },
  { value: 'Improvement Discussion', label: 'Improvement Discussion' },
  { value: 'Career Development', label: 'Career Development' },
  { value: 'Mid-Year Review', label: 'Mid-Year Review' }
];

export const TRAINING_TYPES = [
  { value: 'Technical', label: 'Technical' },
  { value: 'Behavioral', label: 'Behavioral' },
  { value: 'Leadership', label: 'Leadership' },
  { value: 'Compliance', label: 'Compliance' },
  { value: 'Orientation', label: 'Orientation' },
  { value: 'Specialized', label: 'Specialized' }
];

export const PRIORITY_LEVELS = [
  { value: 'Critical', label: 'Critical', color: 'text-red-600 bg-red-100' },
  { value: 'High', label: 'High', color: 'text-orange-600 bg-orange-100' },
  { value: 'Medium', label: 'Medium', color: 'text-yellow-600 bg-yellow-100' },
  { value: 'Low', label: 'Low', color: 'text-green-600 bg-green-100' }
];

export const PROFICIENCY_LEVELS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Developing', label: 'Developing' },
  { value: 'Proficient', label: 'Proficient' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Expert', label: 'Expert' }
];
