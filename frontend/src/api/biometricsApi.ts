/**
 * NEBR - Biometrics API (Frontend)
 *
 * API functions for biometrics features using axios
 */

import api from './axios';
import { AxiosResponse } from 'axios';
import {
  StartEnrollmentValues,
  EnrollmentStatusResponse,
  DeviceStatusResponse,
  StartEnrollmentResponse
} from '../schemas/biometricsSchema';

export const biometricsApi = {
  /**
   * Start fingerprint enrollment for an employee
   */
  startEnrollment: async (
    data: StartEnrollmentValues
  ): Promise<AxiosResponse<StartEnrollmentResponse>> => {
    try {
      return await api.post('/biometrics/enroll/start', data);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get enrollment status for an employee
   */
  getEnrollmentStatus: async (
    employeeId: string
  ): Promise<AxiosResponse<EnrollmentStatusResponse>> => {
    try {
      return await api.get(`/biometrics/enroll/status/${employeeId}`);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get device connection status
   */
  getDeviceStatus: async (): Promise<AxiosResponse<DeviceStatusResponse>> => {
    try {
      return await api.get('/biometrics/device/status');
    } catch (error) {
      throw error;
    }
  }
};
