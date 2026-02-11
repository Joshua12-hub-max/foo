import api from './axios';

export const reportsApi = {
  getReportData: async (reportId: string, params?: Record<string, unknown>) => {
    const response = await api.get(`/reports/${reportId}`, { params });
    return response.data;
  },
};
