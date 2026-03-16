import api from './axios';

export interface ShiftTemplateData {
  id?: number;
  name: string;
  startTime: string;
  endTime: string;
  departmentId?: number | null;
  departmentName?: string | null;
  description?: string;
}

export const scheduleApi = {
  getSchedules: async () => {
    return (await api.get('/schedules')).data;
  },

  getShiftTemplates: async () => {
    console.warn('[DEBUG] Fetching shift templates from /schedules/shift-templates');
    const res = await api.get('/schedules/shift-templates');
    console.warn('[DEBUG] Received shift templates response:', res.data);
    return res.data;
  },

  getDepartmentSchedules: async () => {
    return (await api.get('/schedules/get-department-schedules')).data;
  },

  createShiftTemplate: async (data: ShiftTemplateData) => {
    console.log('[DEBUG] API: Creating shift template', data);
    const res = await api.post('/schedules/shift-templates', data);
    console.log('[DEBUG] API: Create shift template response:', res.data);
    return res.data;
  },

  updateShiftTemplate: async (id: number, data: Partial<ShiftTemplateData>) => {
    return (await api.put(`/schedules/shift-templates/${id}`, data)).data;
  },

  deleteShiftTemplate: async (id: number) => {
    return (await api.delete(`/schedules/shift-templates/${id}`)).data;
  },

  createSchedule: async (data: { employeeId: string; startDate: string; endDate: string; startTime: string; endTime: string; repeat?: string; isRestDay?: boolean; title?: string; }) => {
    return (await api.post('/schedules', data)).data;
  },

  createDepartmentSchedule: async (data: { departmentId: number; startDate: string; endDate: string; startTime: string; endTime: string; repeat: string; scheduleTitle: string; }) => {
    return (await api.post('/schedules/dept-bulk-create', data)).data;
  },

  updateSchedule: async (id: string | number, data: Partial<{ employeeId: string; startDate: string; endDate: string; startTime: string; endTime: string; repeat: string; isRestDay: boolean; }>) => {
    return (await api.put(`/schedules/${id}`, data)).data;
  },

  deleteSchedule: async (id: string | number) => {
    return (await api.delete(`/schedules/${id}`)).data;
  }
};
