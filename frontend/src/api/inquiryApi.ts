import api from './axios';
import { AxiosResponse } from 'axios';

export interface Inquiry {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  status: 'Pending' | 'Read' | 'Replied' | 'Archived';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InquirySubmission {
  firstName: string;
  lastName: string;
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
  updateStatus: async (id: number, data: { status: string; adminNotes?: string }): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    api.patch(`/inquiries/${id}/status`, data),

  /**
   * Admin: Delete an inquiry
   */
  delete: async (id: number): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    api.delete(`/inquiries/${id}`)
};
