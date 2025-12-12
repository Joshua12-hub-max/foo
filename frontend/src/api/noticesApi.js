//Performance Notices API
import axios from './axios';

// Get all notices
export const fetchPerformanceNotices = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.employee_id) params.append('employee_id', filters.employee_id);
    if (filters.notice_type) params.append('notice_type', filters.notice_type);
    if (filters.status) params.append('status', filters.status);
    if (filters.department) params.append('department', filters.department);
    
    const response = await axios.get(`/performance-notices?${params.toString()}`);
    return response.data;
  } catch (error) {
    return { success: false, notices: [] };
  }
};

// Get single notice
export const fetchPerformanceNotice = async (id) => {
  try {
    const response = await axios.get(`/performance-notices/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, notice: null };
  }
};

// Get notices summary
export const fetchNoticesSummary = async () => {
  try {
    const response = await axios.get('/performance-notices/summary');
    return response.data;
  } catch (error) {
    return { success: false, summary: [], employeesAtRisk: [] };
  }
};

// Create notice
export const createPerformanceNotice = async (data) => {
  try {
    const response = await axios.post('/performance-notices', data);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to create notice' };
  }
};

// Issue notice
export const issueNotice = async (id) => {
  try {
    const response = await axios.post(`/performance-notices/${id}/issue`);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to issue notice' };
  }
};

// Acknowledge notice (Employee)
export const acknowledgeNotice = async (id, response) => {
  try {
    const res = await axios.post(`/performance-notices/${id}/acknowledge`, { response });
    return res.data;
  } catch (error) {
    return { success: false, message: 'Failed to acknowledge notice' };
  }
};

// Update notice status
export const updateNoticeStatus = async (id, data) => {
  try {
    const response = await axios.put(`/performance-notices/${id}/status`, data);
    return response.data;
  } catch (error) {
    return { success: false, message: 'Failed to update notice' };
  }
};
