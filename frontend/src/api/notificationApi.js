import api from './axios';

export const notificationApi = {
    getNotifications: async (params) => {
        try {
            const response = await api.get('/notifications', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },
    getUnreadCount: async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            return response;
        } catch (error) {
            throw error;
        }
    },
    markAsRead: async (id) => {
        try {
            const response = await api.put(`/notifications/${id}/read`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    deleteNotification: async (id) => {
        try {
            const response = await api.delete(`/notifications/${id}`);
            return response;
        } catch (error) {
            throw error;
        }
    }
};
