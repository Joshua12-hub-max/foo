import api from './axios';

export const scheduleApi = {
  getSchedules: async () => {
    return await api.get('/schedules');
  },

  createSchedule: async (data: { employee_id: string; start_date: string; end_date: string; start_time: string; end_time: string; repeat?: string; is_rest_day?: boolean; }) => {
    return await api.post('/schedules', data);
  },

  updateSchedule: async (id: string | number, data: Partial<{ employee_id: string; start_date: string; end_date: string; start_time: string; end_time: string; repeat: string; is_rest_day: boolean; }>) => {
    return await api.put(`/schedules/${id}`, data);
  },

  deleteSchedule: async (id: string | number) => {
    return await api.delete(`/schedules/${id}`);
  }
};
