import api from './axios';

export const reportsApi = {
  getReportData: async (reportId: string, params?: any) => {
    const response = await api.get(`/reports/${reportId}`, { params });
    return response.data;
  },
};
