import api from './axios';
import type { AxiosResponse } from 'axios';

// ============================================================================
// Response Type Definitions
// ============================================================================

export interface GoogleAuthUrlResponse {
  authUrl: string;
}

export interface GoogleSyncStatusResponse {
  connected: boolean;
  lastSync?: string;
  syncEnabled?: boolean;
  syncedEventsCount?: number;
}

export interface GoogleSyncResultResponse {
  message: string;
  imported?: number;
  exported?: number;
  total?: number;
}

export interface GoogleDisconnectResponse {
  message: string;
}

// ============================================================================
// API Functions (100% Type-Safe)
// ============================================================================

export const googleCalendarApi = {
  /**
   * Get the Google OAuth authorization URL
   */
  getAuthUrl: async (): Promise<AxiosResponse<GoogleAuthUrlResponse>> => {
    return await api.get<GoogleAuthUrlResponse>('/google-calendar/auth');
  },

  /**
   * Get the current sync status
   */
  getSyncStatus: async (): Promise<AxiosResponse<GoogleSyncStatusResponse>> => {
    return await api.get<GoogleSyncStatusResponse>('/google-calendar/sync/status');
  },

  /**
   * Disconnect Google Calendar
   */
  disconnect: async (): Promise<AxiosResponse<GoogleDisconnectResponse>> => {
    return await api.post<GoogleDisconnectResponse>('/google-calendar/disconnect');
  },

  /**
   * Import events from Google Calendar
   */
  importEvents: async (): Promise<AxiosResponse<GoogleSyncResultResponse>> => {
    return await api.post<GoogleSyncResultResponse>('/google-calendar/sync/import');
  },

  /**
   * Export events to Google Calendar
   */
  exportEvents: async (): Promise<AxiosResponse<GoogleSyncResultResponse>> => {
    return await api.post<GoogleSyncResultResponse>('/google-calendar/sync/export');
  },
};
