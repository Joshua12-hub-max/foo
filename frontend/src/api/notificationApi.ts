import api from './axios';
import { AxiosResponse } from 'axios';

export const notificationApi = {
    getNotifications: async (params: Record<string, unknown>): Promise<AxiosResponse> => {
        return await api.get('/notifications', { params });
    },
    getUnreadCount: async (): Promise<AxiosResponse> => {
        return await api.get('/notifications/unreadCount');
    },
    markAsRead: async (id: string | number): Promise<AxiosResponse> => {
        return await api.put(`/notifications/${id}/read`);
    },
    deleteNotification: async (id: string | number): Promise<AxiosResponse> => {
        return await api.delete(`/notifications/${id}`);
    }
};
