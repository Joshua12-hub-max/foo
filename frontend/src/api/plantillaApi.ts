import api from './axios';
import { AxiosResponse } from 'axios';

export interface Position {
  id: number;
  item_number: string;
  position_title: string;
  salary_grade: number;
  step_increment: number;
  department: string;
  department_id?: number;
  department_name?: string;
  monthly_salary?: string | number;
  is_vacant: boolean;
  incumbent_name?: string;
  incumbent_id?: number;
  status?: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
  area_code?: string;
  area_type?: 'R' | 'P' | 'D' | 'M' | 'F' | 'B';
  area_level?: 'K' | 'T' | 'S' | 'A';
  // Incumbent Details for Form 5
  birth_date?: string;
  date_hired?: string;
  gender?: string;
  eligibility?: string;
  original_appointment_date?: string;
  last_promotion_date?: string;
}

export interface PlantillaSummary {
  total: number;
  filled: number;
  vacant: number;
  vacancy_rate: number;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  action?: string;
  date_from?: string;
  date_to?: string;
}

export interface CreateTrancheParams {
  name: string;
  tranche_number: number;
  circular_number: string;
  effective_date: string;
}

export interface Tranche {
  id: number;
  tranche_number: number;
  name: string;
  circular_number: string;
  effective_date: string;
  date_issued: string;
  applicable_to: string;
  is_active: boolean;
}

export const plantillaApi = {
    // Get all positions with incumbent details
    getPositions: async (params: { department_id?: number | string; department?: string; is_vacant?: boolean; search?: string }): Promise<AxiosResponse<{ success: boolean; positions: Position[] }>> => {
        try {
            const response = await api.get('/plantilla', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get summary statistics
    getSummary: async (): Promise<AxiosResponse<{ success: boolean; summary: PlantillaSummary }>> => {
        try {
            const response = await api.get('/plantilla/summary');
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Create position
    createPosition: async (data: Omit<Position, 'id'>): Promise<AxiosResponse<{ success: boolean; id: number }>> => {
        try {
            const response = await api.post('/plantilla', data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Update position
    updatePosition: async (id: string | number, data: Partial<Position>): Promise<AxiosResponse<{ success: boolean }>> => {
        try {
            const response = await api.put(`/plantilla/${id}`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Delete position
    deletePosition: async (id: string | number): Promise<AxiosResponse> => {
        try {
            const response = await api.delete(`/plantilla/${id}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Assign employee to position
    assignEmployee: async (positionId: string | number, data: { employee_id: number; start_date: string }): Promise<AxiosResponse<{ success: boolean }>> => {
        try {
            const response = await api.post(`/plantilla/${positionId}/assign`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Vacate position
    vacatePosition: async (positionId: string | number, data: { reason: string }): Promise<AxiosResponse<{ success: boolean }>> => {
        try {
            const response = await api.post(`/plantilla/${positionId}/vacate`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get position history
    getPositionHistory: async (positionId: string | number): Promise<AxiosResponse> => {
        try {
            const response = await api.get(`/plantilla/${positionId}/history`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get audit log
    getAuditLog: async (params: AuditLogParams): Promise<AxiosResponse> => {
        try {
            const response = await api.get('/plantilla/audit-log', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get available employees for assignment
    getAvailableEmployees: async (): Promise<AxiosResponse> => {
        try {
            const response = await api.get('/plantilla/available-employees');
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get salary schedule based on grade and step
    getSalarySchedule: async (grade: string | number, step: string | number): Promise<AxiosResponse> => {
        try {
            const response = await api.get('/plantilla/salary-schedule', { 
                params: { grade, step } 
            });
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get full salary schedule (all grades and steps)
    getFullSalarySchedule: async (tranche?: number): Promise<AxiosResponse<{ success: boolean; schedule: Array<{ salaryGrade: number; step: number; monthlySalary: number }> }>> => {
        try {
            const response = await api.get('/plantilla/salary-schedule', {
                params: tranche ? { tranche } : {}
            });
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get all tranches
    getTranches: async (): Promise<AxiosResponse<{ success: boolean; tranches: Tranche[] }>> => {
        try {
            const response = await api.get('/plantilla/tranches');
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get active tranche
    getActiveTranche: async (): Promise<AxiosResponse<{ success: boolean; tranche: Tranche | null }>> => {
        try {
            const response = await api.get('/plantilla/tranches/active');
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Set active tranche
    setActiveTranche: async (id: number): Promise<AxiosResponse> => {
        try {
            const response = await api.put(`/plantilla/tranches/${id}/activate`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Create a new tranche
    createTranche: async (data: CreateTrancheParams): Promise<AxiosResponse<{ success: boolean; tranche: Tranche }>> => {
        try {
            const response = await api.post('/plantilla/tranches', data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Upload salary schedule
    uploadSalarySchedule: async (data: { tranche: number; salaryData: Array<{ salary_grade: number; step: number; monthly_salary: number }> }): Promise<AxiosResponse> => {
        try {
            const response = await api.post('/plantilla/salary-schedule/upload', data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get tranche allowances
    getTrancheAllowances: async (trancheId: number): Promise<AxiosResponse<{ success: boolean; allowances: TrancheAllowance[] }>> => {
        try {
            const response = await api.get(`/plantilla/tranches/${trancheId}/allowances`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Copy allowances from another tranche
    copyTrancheAllowances: async (targetTrancheId: number, sourceTrancheId: number): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        try {
            const response = await api.post(`/plantilla/tranches/${targetTrancheId}/allowances/copy`, {
                source_tranche_id: sourceTrancheId
            });
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Update specific allowance
    updateTrancheAllowance: async (id: number, data: Partial<TrancheAllowance>): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        try {
            const response = await api.put(`/plantilla/tranches/allowances/${id}`, data);
            return response;
        } catch (error) {
            throw error;
        }
    }
};

export interface AllowanceRate {
  id: number;
  condition_key: string;
  amount: number;
  value_type: 'FIXED' | 'PERCENTAGE';
}

export interface TrancheAllowance {
  id: number;
  tranche_id: number;
  name: string;
  description?: string;
  amount?: number;
  is_matrix: boolean;
  category: 'Monthly' | 'Annual' | 'Bonus';
  rates?: AllowanceRate[];
}

export const {
    getPositions,
    getSummary,
    createPosition,
    updatePosition,
    deletePosition,
    assignEmployee,
    vacatePosition,
    getPositionHistory,
    getAuditLog,
    getAvailableEmployees,
    getSalarySchedule,
    getFullSalarySchedule,
    getTranches,
    getActiveTranche,
    setActiveTranche,
    createTranche,
    uploadSalarySchedule,
    getTrancheAllowances,
    copyTrancheAllowances,
    updateTrancheAllowance
} = plantillaApi;
