import api from './axios';
import { AxiosResponse } from 'axios';

export const announcementApi = {
    getAnnouncements: async (): Promise<AxiosResponse> => {
        return await api.get('/announcement/all');
    },
    createAnnouncement: async (data: Record<string, unknown>): Promise<AxiosResponse> => {
        return await api.post('/announcement/create', data);
    },
    updateAnnouncement: async (id: string | number, data: Record<string, unknown>): Promise<AxiosResponse> => {
        return await api.put(`/announcement/${id}`, data);
    },
    deleteAnnouncement: async (id: string | number): Promise<AxiosResponse> => {
        return await api.delete(`/announcement/${id}`);
    }
};
