import api from './axios';
import { AxiosResponse } from 'axios';

export interface Inquiry {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  message: string;
  status: 'Pending' | 'Read' | 'Replied' | 'Archived';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InquirySubmission {
  first_name: string;
  last_name: string;
  email: string;
  message: string;
}

export const inquiryApi = {
  
  submit: async (data: InquirySubmission): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    api.post('/inquiries', data),

  /**
   * Admin: Get all inquiries
   */
  getAll: async (status?: string): Promise<AxiosResponse<{ success: boolean; inquiries: Inquiry[] }>> =>
    api.get('/inquiries', { params: { status } }),

  /**
   * Admin: Update inquiry status
   */
  updateStatus: async (id: number, data: { status: string; admin_notes?: string }): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    api.patch(`/inquiries/${id}/status`, data),

  /**
   * Admin: Delete an inquiry
   */
  delete: async (id: number): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    api.delete(`/inquiries/${id}`)
};
