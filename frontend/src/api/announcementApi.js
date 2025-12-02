import api from './axios';

export const announcementApi = {
    getAnnouncements: async () => {
        try {
            const response = await api.get('/announcement/all');
            return response;
        } catch (error) {
            throw error;
        }
    },
    createAnnouncement: async (data) => {
        try {
            const response = await api.post('/announcement/create', data);
            return response;
        } catch (error) {
            throw error;
        }
    }
};
