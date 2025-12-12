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
    },
    updateAnnouncement: async (id, data) => {
        try {
            const response = await api.put(`/announcement/${id}`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    deleteAnnouncement: async (id) => {
        try {
            const response = await api.delete(`/announcement/${id}`);
            return response;
        } catch (error) {
            throw error;
        }
    }
};

