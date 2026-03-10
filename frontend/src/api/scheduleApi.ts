import api from './axios';

export const scheduleApi = {
  getSchedules: async () => {
    return await api.get('/schedules');
  },

  createSchedule: async (data: { employeeId: string; startDate: string; endDate: string; startTime: string; endTime: string; repeat?: string; isRestDay?: boolean; }) => {
    return await api.post('/schedules', data);
  },

  updateSchedule: async (id: string | number, data: Partial<{ employeeId: string; startDate: string; endDate: string; startTime: string; endTime: string; repeat: string; isRestDay: boolean; }>) => {
    return await api.put(`/schedules/${id}`, data);
  },

  deleteSchedule: async (id: string | number) => {
    return await api.delete(`/schedules/${id}`);
  }
};
