import api from './axios';
import { AxiosResponse } from 'axios';

export const leaveApi = {
    // data should be FormData object if containing file
    applyLeave: async (data: FormData | any): Promise<AxiosResponse> => {
        try {
            // Axios handles Content-Type: multipart/form-data if data is FormData
            const response = await api.post('/leave/apply', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    getMyLeaves: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
    }): Promise<AxiosResponse> => {
        try {
            const response = await api.get('/leave/my-leaves', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },
    getAllLeaves: async (params?: { 
        page?: number; 
        limit?: number; 
        search?: string;
        department?: string;
        employeeId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<AxiosResponse> => {
        try {
            const response = await api.get('/leave/all', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },
    getCredits: async (employeeId: string | number): Promise<AxiosResponse> => {
        try {
            const response = await api.get(`/leave/credits/${employeeId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    getMyCredits: async (): Promise<AxiosResponse> => {
        try {
            const response = await api.get('/leave/my-credits');
            return response;
        } catch (error) {
            throw error;
        }
    },
    approveLeave: async (id: string | number): Promise<AxiosResponse> => {
        try {
            const response = await api.put(`/leave/${id}/approve`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    rejectLeave: async (id: string | number, reason: string): Promise<AxiosResponse> => {
        try {
            const response = await api.put(`/leave/${id}/reject`, { reason });
            return response;
        } catch (error) {
            throw error;
        }
    },
    // Admin processes and uploads form
    processLeave: async (id: string | number, formData: FormData | any): Promise<AxiosResponse> => {
        try {
            const response = await api.put(`/leave/${id}/process`, formData);
            return response;
        } catch (error) {
            throw error;
        }
    },
    // Employee uploads signed form
    finalizeLeave: async (id: string | number, formData: FormData | any): Promise<AxiosResponse> => {
        try {
            const response = await api.put(`/leave/${id}/finalize`, formData);
            return response;
        } catch (error) {
            throw error;
        }
    },
    // Admin Credit Management
    getAllEmployeeCredits: async (params?: { 
        page?: number; 
        limit?: number; 
        search?: string; 
    }): Promise<AxiosResponse> => {
        try {
            const response = await api.get('/leave/credits/all', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },
    updateEmployeeCredit: async (employeeId: string | number, creditType: string, balance: number): Promise<AxiosResponse> => {
        try {
            const response = await api.put(`/leave/credits/${employeeId}`, { creditType, balance });
            return response;
        } catch (error) {
            throw error;
        }
    },
    deleteEmployeeCredit: async (employeeId: string | number, creditType: string): Promise<AxiosResponse> => {
        try {
            // Send creditType as query param
            const response = await api.delete(`/leave/credits/${employeeId}`, { params: { creditType } });
            return response;
        } catch (error) {
            throw error;
        }
    },
};
