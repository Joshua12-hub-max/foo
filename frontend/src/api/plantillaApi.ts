import api from './axios';
import { AxiosResponse } from 'axios';

export const plantillaApi = {
    // Get all positions with incumbent details
    getPositions: async (params: any): Promise<AxiosResponse> => {
        try {
            const response = await api.get('/plantilla', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get summary statistics
    getSummary: async (): Promise<AxiosResponse> => {
        try {
            const response = await api.get('/plantilla/summary');
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Create position
    createPosition: async (data: any): Promise<AxiosResponse> => {
        try {
            const response = await api.post('/plantilla', data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Update position
    updatePosition: async (id: string | number, data: any): Promise<AxiosResponse> => {
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
    assignEmployee: async (positionId: string | number, data: any): Promise<AxiosResponse> => {
        try {
            const response = await api.post(`/plantilla/${positionId}/assign`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Vacate position
    vacatePosition: async (positionId: string | number, data: any): Promise<AxiosResponse> => {
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
    getAuditLog: async (params: any): Promise<AxiosResponse> => {
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
    getSalarySchedule
} = plantillaApi;
