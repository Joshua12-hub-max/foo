import axios from './axios';
import { ApiResponse } from '../types';

export interface Memo {
  id: number;
  employeeId: number;
  employeeName?: string;
  authorName?: string;
  memoNumber: string;
  memoType: string;
  subject: string;
  content?: string;
  priority: string;
  status: string;
  effectiveDate?: string;
  acknowledgmentRequired?: boolean;
  acknowledgedAt?: string;
  createdAt: string;
  reviewerName?: string;
}

// Fetch all memos with filters
export const fetchMemos = async (params: Record<string, unknown> = {}): Promise<ApiResponse<{ memos: Memo[] }>> => {
    const response = await axios.get('/memos', { params });
    return response.data;
};

// Fetch my memos (for employees)
export const fetchMyMemos = async (): Promise<ApiResponse<{ memos: Memo[] }>> => {
    const response = await axios.get('/memos/my');
    return response.data;
};

// Fetch single memo
export const fetchMemoById = async (id: string | number): Promise<ApiResponse<{ memo: Memo }>> => {
    const response = await axios.get(`/memos/${id}`);
    return response.data;
};

// Create memo
export const createMemo = async (data: Record<string, unknown>): Promise<ApiResponse<{ success: boolean; id: number }>> => {
    const response = await axios.post('/memos', data);
    return response.data;
};

// Update memo
export const updateMemo = async (id: string | number, data: Record<string, unknown>): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.put(`/memos/${id}`, data);
    return response.data;
};

// Delete memo
export const deleteMemo = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.delete(`/memos/${id}`);
    return response.data;
};

// Acknowledge memo
export const acknowledgeMemo = async (id: string | number): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await axios.post(`/memos/${id}/acknowledge`);
    return response.data;
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
