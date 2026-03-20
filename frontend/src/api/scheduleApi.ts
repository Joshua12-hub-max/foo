import api from './axios';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  schedules?: T;
  templates?: T;
  period?: { start: string; end: string };
}

export interface ShiftTemplateData {
  id?: number;
  name: string;
  startTime: string;
  endTime: string;
  departmentId: number | null;
  departmentName?: string;
  description?: string;
  isDefault?: boolean;
  workingDays?: string;
}

export interface ScheduleData {
  id: number;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  scheduleTitle: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
}

export interface DeptSummaryData {
  id: number;
  departmentName: string;
  shifts: {
    startTime: string;
    endTime: string;
    scheduleTitle: string;
    personnelCount: number;
    isStandard: boolean;
  }[];
  totalStrength: number;
}

export const scheduleApi = {
  getSchedules: async (): Promise<ApiResponse<ScheduleData[]>> => {
    return (await api.get('/schedules')).data;
  },

  getNextCutOffSchedules: async (): Promise<ApiResponse<ScheduleData[]>> => {
    return (await api.get('/schedules/next-cutoff')).data;
  },

  getDepartmentSchedulesSummary: async (): Promise<ApiResponse<DeptSummaryData[]>> => {
    return (await api.get('/schedules/department-summary')).data;
  },

  getShiftTemplates: async (): Promise<ApiResponse<ShiftTemplateData[]>> => {
    return (await api.get('/schedules/shift-templates')).data;
  },

  createShiftTemplate: async (data: Partial<ShiftTemplateData>): Promise<ApiResponse<void>> => {
    return (await api.post('/schedules/shift-templates', data)).data;
  },

  updateShiftTemplate: async (id: number, data: Partial<ShiftTemplateData>): Promise<ApiResponse<void>> => {
    return (await api.put(`/schedules/shift-templates/${id}`, data)).data;
  },

  deleteShiftTemplate: async (id: number): Promise<ApiResponse<void>> => {
    return (await api.delete(`/schedules/shift-templates/${id}`)).data;
  },

  createSchedule: async (data: { employeeId: string; startDate: string; endDate: string; startTime: string; endTime: string; repeat?: string; isRestDay?: boolean; title?: string; }): Promise<ApiResponse<void>> => {
    return (await api.post('/schedules', data)).data;
  },

  createDepartmentSchedule: async (data: { departmentId: number; startDate: string; endDate: string; startTime: string; endTime: string; repeat: string; scheduleTitle: string; }): Promise<ApiResponse<void>> => {
    return (await api.post('/schedules/dept-bulk-create', data)).data;
  },

  updateSchedule: async (id: string | number, data: Partial<{ employeeId: string; startDate: string; endDate: string; startTime: string; endTime: string; repeat: string; isRestDay: boolean; }>): Promise<ApiResponse<void>> => {
    return (await api.put(`/schedules/${id}`, data)).data;
  },

  deleteSchedule: async (id: string | number): Promise<ApiResponse<void>> => {
    return (await api.delete(`/schedules/${id}`)).data;
  }
};

export default scheduleApi;

// Force Vite HMR reload
