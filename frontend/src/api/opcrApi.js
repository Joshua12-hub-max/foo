//OPCR API (Office Performance Commitment & Review)
import axios from './axios';

// Get all OPCRs
export const fetchOPCRs = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.cycle_id) params.append('cycle_id', filters.cycle_id);
    if (filters.department) params.append('department', filters.department);
    if (filters.status) params.append('status', filters.status);
    
    const response = await axios.get(`/opcr?${params.toString()}`);
    return response.data;
  } catch (error) {
    return { success: false, opcrs: [] };
  }
};

// Get single OPCR with items
export const fetchOPCR = async (id) => {
  try {
    const response = await axios.get(`/opcr/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, opcr: null };
  }
};

// Create OPCR
export const createOPCR = async (data) => {
  try {
    const response = await axios.post('/opcr', data);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to create OPCR' };
  }
};

// Update OPCR
export const updateOPCR = async (id, data) => {
  try {
    const response = await axios.put(`/opcr/${id}`, data);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to update OPCR' };
  }
};

// Delete OPCR
export const deleteOPCR = async (id) => {
  try {
    const response = await axios.delete(`/opcr/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to delete OPCR' };
  }
};

// OPCR Items
export const addOPCRItem = async (opcrId, data) => {
  try {
    const response = await axios.post(`/opcr/${opcrId}/items`, data);
    return response.data;
  } catch (error) {
    return { success: false, message: 'Failed to add item' };
  }
};

export const updateOPCRItem = async (opcrId, itemId, data) => {
  try {
    const response = await axios.put(`/opcr/${opcrId}/items/${itemId}`, data);
    return response.data;
  } catch (error) {
    return { success: false, message: 'Failed to update item' };
  }
};

export const deleteOPCRItem = async (opcrId, itemId) => {
  try {
    const response = await axios.delete(`/opcr/${opcrId}/items/${itemId}`);
    return response.data;
  } catch (error) {
    return { success: false, message: 'Failed to delete item' };
  }
};

// OPCR Workflow
export const submitOPCR = async (id) => {
  try {
    const response = await axios.post(`/opcr/${id}/submit`);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to submit OPCR' };
  }
};

export const reviewOPCR = async (id, remarks) => {
  try {
    const response = await axios.post(`/opcr/${id}/review`, { remarks });
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to review OPCR' };
  }
};

export const approveOPCR = async (id, remarks) => {
  try {
    const response = await axios.post(`/opcr/${id}/approve`, { remarks });
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to approve OPCR' };
  }
};

export const finalizeOPCR = async (id) => {
  try {
    const response = await axios.post(`/opcr/${id}/finalize`);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to finalize OPCR' };
  }
};

// Validation
export const validateIPCRAgainstOPCR = async (ipcrId) => {
  try {
    const response = await axios.get(`/opcr/validate/ipcr/${ipcrId}`);
    return response.data;
  } catch (error) {
    return { success: false, valid: false };
  }
};

export const getDepartmentRatingAverage = async (department, cycleId) => {
  try {
    const response = await axios.get(`/opcr/validate/department?department=${department}&cycle_id=${cycleId}`);
    return response.data;
  } catch (error) {
    return { success: false, summary: null };
  }
};
