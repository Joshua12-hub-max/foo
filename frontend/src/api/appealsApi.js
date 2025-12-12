/**
 * Appeals API
 */

import axios from './axios';

// Get all appeals
export const fetchAppeals = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.employee_id) params.append('employee_id', filters.employee_id);
    if (filters.cycle_id) params.append('cycle_id', filters.cycle_id);
    
    const response = await axios.get(`/appeals?${params.toString()}`);
    return response.data;
  } catch (error) {
    return { success: false, appeals: [] };
  }
};

// Get single appeal
export const fetchAppeal = async (id) => {
  try {
    const response = await axios.get(`/appeals/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, appeal: null };
  }
};

// File an appeal
export const fileAppeal = async (data) => {
  try {
    const response = await axios.post('/appeals', data);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to file appeal' };
  }
};

// Review appeal (PMT/Admin)
export const reviewAppeal = async (id, data) => {
  try {
    const response = await axios.post(`/appeals/${id}/review`, data);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to review appeal' };
  }
};

// Decide appeal (PMT/Admin)
export const decideAppeal = async (id, data) => {
  try {
    const response = await axios.post(`/appeals/${id}/decide`, data);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to decide appeal' };
  }
};

// Withdraw appeal
export const withdrawAppeal = async (id) => {
  try {
    const response = await axios.post(`/appeals/${id}/withdraw`);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to withdraw appeal' };
  }
};
