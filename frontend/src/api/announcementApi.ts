import api from './axios';
import { AxiosResponse } from 'axios';

export const announcementApi = {
    getAnnouncements: async (): Promise<AxiosResponse> => {
        try {
            const response = await api.get('/announcement/all');
            return response;
        } catch (error) {
            throw error;
        }
    },
    createAnnouncement: async (data: Record<string, unknown>): Promise<AxiosResponse> => {
        try {
            const response = await api.post('/announcement/create', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    updateAnnouncement: async (id: string | number, data: Record<string, unknown>): Promise<AxiosResponse> => {
        try {
            const response = await api.put(`/announcement/${id}`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    deleteAnnouncement: async (id: string | number): Promise<AxiosResponse> => {
        try {
            const response = await api.delete(`/announcement/${id}`);
            return response;
        } catch (error) {
            throw error;
        }
    }
};
