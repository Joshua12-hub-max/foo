import api from './axios';

export const eventApi = {
    getEvents: async () => {
        try {
            const response = await api.get('/event/all');
            return response;
        } catch (error) {
            throw error;
        }
    },
    createEvent: async (data) => {
        try {
            const response = await api.post('/event/create', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    updateEvent: async (id, data) => {
        try {
            const response = await api.put(`/event/${id}`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    deleteEvent: async (id) => {
        try {
            const response = await api.delete(`/event/${id}`);
            return response;
        } catch (error) {
            throw error;
        }
    }
};
