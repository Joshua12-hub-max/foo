import axios from './axios';

//Employee Memo API

// Fetch all memos with filters
export const fetchMemos = async (params: any = {}): Promise<any> => {
  try {
    const response = await axios.get('/memos', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetch my memos (for employees)
export const fetchMyMemos = async (): Promise<any> => {
  try {
    const response = await axios.get('/memos/my');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetch single memo
export const fetchMemoById = async (id: string | number): Promise<any> => {
  try {
    const response = await axios.get(`/memos/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create memo
export const createMemo = async (data: any): Promise<any> => {
  try {
    const response = await axios.post('/memos', data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update memo
export const updateMemo = async (id: string | number, data: any): Promise<any> => {
  try {
    const response = await axios.put(`/memos/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete memo
export const deleteMemo = async (id: string | number): Promise<any> => {
  try {
    const response = await axios.delete(`/memos/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Acknowledge memo
export const acknowledgeMemo = async (id: string | number): Promise<any> => {
  try {
    const response = await axios.post(`/memos/${id}/acknowledge`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Constants
export const MEMO_TYPES = [
  { value: 'Verbal Warning', label: 'Verbal Warning' },
  { value: 'Written Warning', label: 'Written Warning' },
  { value: 'Suspension Notice', label: 'Suspension Notice' },
  { value: 'Termination Notice', label: 'Termination Notice' },
  { value: 'Show Cause', label: 'Show Cause' }
];

export const MEMO_PRIORITIES = [
  { value: 'Low', label: 'Low' },
  { value: 'Normal', label: 'Normal' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' }
];

export const MEMO_STATUSES = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Sent', label: 'Sent' },
  { value: 'Acknowledged', label: 'Acknowledged' },
  { value: 'Archived', label: 'Archived' }
];
