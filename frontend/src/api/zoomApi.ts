import api from './axios';
import type { AxiosResponse } from 'axios';

// ============================================================================
// Response Type Definitions
// ============================================================================

export interface ZoomStatusResponse {
  configured: boolean;
  message: string;
}

export interface ZoomMeetingResponse {
  success: boolean;
  meetingId: number;
  meetingLink: string;
  password?: string;
  topic: string;
  startTime: string;
  duration: number;
}

export interface CreateMeetingRequest {
  topic: string;
  startTime: string;
  duration?: number;
  applicantName?: string;
}

export interface ZoomSignatureResponse {
  signature: string;
  sdkKey: string;
}

// ============================================================================
// API Functions (100% Type-Safe)
// ============================================================================

export const zoomApi = {
  /**
   * Check if Zoom is configured on the backend
   */
  getStatus: async (): Promise<AxiosResponse<ZoomStatusResponse>> => {
    return await api.get<ZoomStatusResponse>('/zoom/status');
  },

  /**
   * Create a new Zoom meeting
   */
  createMeeting: async (data: CreateMeetingRequest): Promise<AxiosResponse<ZoomMeetingResponse>> => {
    return await api.post<ZoomMeetingResponse>('/zoom/meeting', data);
  },

  /**
   * Get Zoom Web SDK signature for embedding meetings
   */
  getSignature: async (meetingNumber: string, role: number): Promise<AxiosResponse<ZoomSignatureResponse>> => {
    return await api.post<ZoomSignatureResponse>('/zoom/signature', {
      meetingNumber,
      role, // 0 = participant, 1 = host
    });
  },
};
