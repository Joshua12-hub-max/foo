import axios from 'axios';

const API_URL = 'http://localhost:5000/api/schedules';

export const scheduleApi = {
  getSchedules: async () => {
    return await axios.get(`${API_URL}`, { withCredentials: true });
  },

  createSchedule: async (data: { employee_id: string; start_date: string; end_date: string; start_time: string; end_time: string; repeat?: string; is_rest_day?: boolean; }) => {
    return await axios.post(`${API_URL}`, data, { withCredentials: true });
  },

  updateSchedule: async (id: string | number, data: Partial<{ employee_id: string; start_date: string; end_date: string; start_time: string; end_time: string; repeat: string; is_rest_day: boolean; }>) => {
    return await axios.put(`${API_URL}/${id}`, data, { withCredentials: true });
  },

  deleteSchedule: async (id: string | number) => {
    return await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
  }
};
