import api from './axios';
import { AxiosResponse } from 'axios';

export interface Position {
  id: number;
  itemNumber: string;
  positionTitle: string;
  salaryGrade: number;
  stepIncrement: number;
  department: string;
  departmentId?: number;
  departmentName?: string;
  monthlySalary?: string | number;
  isVacant: boolean;
  incumbentName?: string;
  incumbentId?: number;
  status?: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
  areaCode?: string;
  areaType?: 'R' | 'P' | 'D' | 'M' | 'F' | 'B';
  areaLevel?: 'K' | 'T' | 'S' | 'A';
  // Incumbent Details for Form 5
  birthDate?: string;
  dateHired?: string;
  gender?: string;
  eligibility?: string;
  originalAppointmentDate?: string;
  lastPromotionDate?: string;
}

export interface PlantillaSummary {
  total: number;
  filled: number;
  vacant: number;
  vacancyRate: number;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateTrancheParams {
  name: string;
  trancheNumber: number;
  circularNumber: string;
  effectiveDate: string;
}

export interface Tranche {
  id: number;
  trancheNumber: number;
  name: string;
  circularNumber: string;
  effectiveDate: string;
  dateIssued: string;
  applicableTo: string;
  isActive: boolean;
}

export interface AllowanceRate {
  id: number;
  conditionKey: string;
  amount: number;
  valueType: 'FIXED' | 'PERCENTAGE';
}

export interface TrancheAllowance {
  id: number;
  trancheId: number;
  name: string;
  description?: string;
  amount?: number;
  isMatrix: boolean;
  category: 'Monthly' | 'Annual' | 'Bonus';
  rates?: AllowanceRate[];
}

export const plantillaApi = {
    // Get all positions with incumbent details
    getPositions: async (params: { departmentId?: number | string; department?: string; isVacant?: boolean; search?: string }): Promise<AxiosResponse<{ success: boolean; positions: Position[] }>> => {
      return await api.get('/plantilla', { params });
    },

    // Get summary statistics
    getSummary: async (): Promise<AxiosResponse<{ success: boolean; summary: PlantillaSummary }>> => {
        return await api.get('/plantilla/summary');
    },

    // Create position
    createPosition: async (data: Omit<Position, 'id'>): Promise<AxiosResponse<{ success: boolean; id: number }>> => {
        return await api.post('/plantilla', data);
    },

    // Update position
    updatePosition: async (id: string | number, data: Partial<Position>): Promise<AxiosResponse<{ success: boolean }>> => {
        return await api.put(`/plantilla/${id}`, data);
    },

    // Delete position
    deletePosition: async (id: string | number): Promise<AxiosResponse> => {
        return await api.delete(`/plantilla/${id}`);
    },

    // Assign employee to position
    assignEmployee: async (positionId: string | number, data: { employeeId: number; startDate: string }): Promise<AxiosResponse<{ success: boolean }>> => {
      return await api.post(`/plantilla/${positionId}/assign`, data);
    },

    // Vacate position
    vacatePosition: async (positionId: string | number, data: { reason: string }): Promise<AxiosResponse<{ success: boolean }>> => {
        return await api.post(`/plantilla/${positionId}/vacate`, data);
    },

    // Get position history
    getPositionHistory: async (positionId: string | number): Promise<AxiosResponse> => {
        return await api.get(`/plantilla/${positionId}/history`);
    },

    // Get audit log
    getAuditLog: async (params: AuditLogParams): Promise<AxiosResponse> => {
        return await api.get('/plantilla/audit-log', { params });
    },

    // Get available employees for assignment
    getAvailableEmployees: async (): Promise<AxiosResponse> => {
        return await api.get('/plantilla/available-employees');
    },

    // Get salary schedule based on grade and step
    getSalarySchedule: async (grade: string | number, step: string | number): Promise<AxiosResponse> => {
        return await api.get('/plantilla/salary-schedule', { 
            params: { grade, step } 
        });
    },

    // Get full salary schedule (all grades and steps)
    getFullSalarySchedule: async (tranche?: number): Promise<AxiosResponse<{ success: boolean; schedule: Array<{ salaryGrade: number; step: number; monthlySalary: number }> }>> => {
        return await api.get('/plantilla/salary-schedule', {
            params: tranche ? { tranche } : {}
        });
    },

    // Get all tranches
    getTranches: async (): Promise<AxiosResponse<{ success: boolean; tranches: Tranche[] }>> => {
        return await api.get('/plantilla/tranches');
    },

    // Get active tranche
    getActiveTranche: async (): Promise<AxiosResponse<{ success: boolean; tranche: Tranche | null }>> => {
        return await api.get('/plantilla/tranches/active');
    },

    // Set active tranche
    setActiveTranche: async (id: number): Promise<AxiosResponse> => {
        return await api.put(`/plantilla/tranches/${id}/activate`);
    },

    // Create a new tranche
    createTranche: async (data: CreateTrancheParams): Promise<AxiosResponse<{ success: boolean; tranche: Tranche }>> => {
        return await api.post('/plantilla/tranches', data);
    },

    // Upload salary schedule
    uploadSalarySchedule: async (data: { tranche: number; salaryData: Array<{ salaryGrade: number; step: number; monthlySalary: number }> }): Promise<AxiosResponse> => {
      return await api.post('/plantilla/salary-schedule/upload', data);
    },

    // Get tranche allowances
    getTrancheAllowances: async (trancheId: number): Promise<AxiosResponse<{ success: boolean; allowances: TrancheAllowance[] }>> => {
        return await api.get(`/plantilla/tranches/${trancheId}/allowances`);
    },

    // Copy allowances from another tranche
    copyTrancheAllowances: async (targetTrancheId: number, sourceTrancheId: number): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        return await api.post(`/plantilla/tranches/${targetTrancheId}/allowances/copy`, {
            sourceTrancheId: sourceTrancheId
        });
    },

    // Update specific allowance
    updateTrancheAllowance: async (id: number, data: Partial<TrancheAllowance>): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        return await api.put(`/plantilla/tranches/allowances/${id}`, data);
    }
};

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
