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
    try {
      return await api.get<GoogleAuthUrlResponse>('/google-calendar/auth');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get the current sync status
   */
  getSyncStatus: async (): Promise<AxiosResponse<GoogleSyncStatusResponse>> => {
    try {
      return await api.get<GoogleSyncStatusResponse>('/google-calendar/sync/status');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Disconnect Google Calendar
   */
  disconnect: async (): Promise<AxiosResponse<GoogleDisconnectResponse>> => {
    try {
      return await api.post<GoogleDisconnectResponse>('/google-calendar/disconnect');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Import events from Google Calendar
   */
  importEvents: async (): Promise<AxiosResponse<GoogleSyncResultResponse>> => {
    try {
      return await api.post<GoogleSyncResultResponse>('/google-calendar/sync/import');
    } catch (error) {
      throw error;
    }
  },

  /**
   * Export events to Google Calendar
   */
  exportEvents: async (): Promise<AxiosResponse<GoogleSyncResultResponse>> => {
    try {
      return await api.post<GoogleSyncResultResponse>('/google-calendar/sync/export');
    } catch (error) {
      throw error;
    }
  },
};
