import api from './axios';
import { AxiosResponse } from 'axios';

export const eventApi = {
    getEvents: async (): Promise<AxiosResponse> => {
        try {
            const response = await api.get('/event/all');
            return response;
        } catch (error) {
            throw error;
        }
    },
    createEvent: async (data: any): Promise<AxiosResponse> => {
        try {
            const response = await api.post('/event/create', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    updateEvent: async (id: string | number, data: any): Promise<AxiosResponse> => {
        try {
            const response = await api.put(`/event/${id}`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    deleteEvent: async (id: string | number): Promise<AxiosResponse> => {
        try {
            const response = await api.delete(`/event/${id}`);
            return response;
        } catch (error) {
            throw error;
        }
    }
};
