import api from './axios';
// Remove local api creation


export interface AllowanceSchedule {
  id: number;
  name: string;
  effectivity_date: string;
  legal_basis?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AllowanceDefinition {
  id: number;
  allowance_schedule_id: number;
  name: string;
  description?: string;
  amount?: number;
  is_matrix: boolean;
  category: 'Monthly' | 'Annual' | 'Bonus';
  rates?: AllowanceMatrixValue[];
}

export interface AllowanceMatrixValue {
  id?: number;
  allowance_definition_id?: number;
  condition_key: string;
  amount: number;
  value_type: 'FIXED' | 'PERCENTAGE';
}

export const allowanceApi = {
  // Schedules
  getSchedules: async () => {
    const response = await api.get<{ success: boolean; schedules: AllowanceSchedule[] }>('/allowances/schedules');
    return response.data.schedules;
  },

  createSchedule: async (data: Partial<AllowanceSchedule>) => {
    const response = await api.post<{ success: boolean; id: number }>('/allowances/schedules', data);
    return response.data;
  },

  getScheduleAllowances: async (id: number) => {
    const response = await api.get<{ success: boolean; allowances: AllowanceDefinition[] }>(`/allowances/schedules/${id}/allowances`);
    return response.data.allowances;
  },

  setActiveSchedule: async (id: number) => {
    const response = await api.put<{ success: boolean; message: string }>(`/allowances/schedules/${id}/activate`);
    return response.data;
  },

  // Active Schedule
  getActiveSchedule: async () => {
    const response = await api.get<{ success: boolean; schedule: (AllowanceSchedule & { allowances: AllowanceDefinition[] }) | null }>('/allowances/active');
    return response.data.schedule;
  },

  // Definitions
  upsertAllowance: async (data: Partial<AllowanceDefinition>) => {
    const response = await api.post<{ success: boolean; id: number }>('/allowances/definitions', data);
    return response.data;
  }
};
