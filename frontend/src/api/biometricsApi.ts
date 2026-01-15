import api from './axios';
import { AxiosResponse } from 'axios';
import { StartEnrollmentValues, EnrollmentStatusResponse } from '../schemas/biometricsSchema';

export const biometricsApi = {
  startEnrollment: async (data: StartEnrollmentValues): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
    return await api.post('/biometrics/enroll/start', data);
  },

  getEnrollmentStatus: async (employeeId: string): Promise<AxiosResponse<EnrollmentStatusResponse>> => {
    return await api.get(`/biometrics/enroll/status/${employeeId}`);
  },
};
