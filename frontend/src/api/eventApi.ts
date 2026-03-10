import api from './axios';
import { AxiosResponse } from 'axios';

export const eventApi = {
    getEvents: async (): Promise<AxiosResponse> => {
        return await api.get('/event/all');
    },
    createEvent: async (data: Record<string, unknown>): Promise<AxiosResponse> => {
        return await api.post('/event/create', data);
    },
    updateEvent: async (id: string | number, data: Record<string, unknown>): Promise<AxiosResponse> => {
        return await api.put(`/event/${id}`, data);
    },
    deleteEvent: async (id: string | number): Promise<AxiosResponse> => {
        return await api.delete(`/event/${id}`);
    }
};
