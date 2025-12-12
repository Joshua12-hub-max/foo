//PMT API (Performance Management Team)
import axios from './axios';

// Dashboard
export const fetchPMTDashboard = async (cycleId) => {
  try {
    const url = cycleId ? `/pmt/dashboard?cycle_id=${cycleId}` : '/pmt/dashboard';
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    return { success: false, dashboard: null };
  }
};

// PMT Members
export const fetchPMTMembers = async (activeOnly = true) => {
  try {
    const response = await axios.get(`/pmt/members?active_only=${activeOnly}`);
    return response.data;
  } catch (error) {
    return { success: false, members: [] };
  }
};

export const addPMTMember = async (data) => {
  try {
    const response = await axios.post('/pmt/members', data);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to add member' };
  }
};

export const updatePMTMember = async (id, data) => {
  try {
    const response = await axios.put(`/pmt/members/${id}`, data);
    return response.data;
  } catch (error) {
    return { success: false, message: 'Failed to update member' };
  }
};

export const removePMTMember = async (id) => {
  try {
    const response = await axios.delete(`/pmt/members/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, message: 'Failed to remove member' };
  }
};

// Meetings
export const fetchPMTMeetings = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.cycle_id) params.append('cycle_id', filters.cycle_id);
    if (filters.meeting_type) params.append('meeting_type', filters.meeting_type);
    if (filters.status) params.append('status', filters.status);
    
    const response = await axios.get(`/pmt/meetings?${params.toString()}`);
    return response.data;
  } catch (error) {
    return { success: false, meetings: [] };
  }
};

export const fetchPMTMeeting = async (id) => {
  try {
    const response = await axios.get(`/pmt/meetings/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, meeting: null };
  }
};

export const createPMTMeeting = async (data) => {
  try {
    const response = await axios.post('/pmt/meetings', data);
    return response.data;
  } catch (error) {
    return { success: false, message: error.response?.data?.message || 'Failed to create meeting' };
  }
};

export const updatePMTMeeting = async (id, data) => {
  try {
    const response = await axios.put(`/pmt/meetings/${id}`, data);
    return response.data;
  } catch (error) {
    return { success: false, message: 'Failed to update meeting' };
  }
};

export const deletePMTMeeting = async (id) => {
  try {
    const response = await axios.delete(`/pmt/meetings/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, message: 'Failed to cancel meeting' };
  }
};

// Calibration
export const fetchCalibrationData = async (cycleId) => {
  try {
    const response = await axios.get(`/pmt/calibration?cycle_id=${cycleId}`);
    return response.data;
  } catch (error) {
    return { success: false, calibrationData: [], violations: [] };
  }
};
