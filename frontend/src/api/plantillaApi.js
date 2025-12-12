import api from './axios';

export const plantillaApi = {
    getPositions: async (params) => {
        try {
            const response = await api.get('/plantilla', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },
    createPosition: async (data) => {
        try {
            const response = await api.post('/plantilla', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    updatePosition: async (id, data) => {
        try {
            const response = await api.put(`/plantilla/${id}`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    deletePosition: async (id) => {
        try {
            const response = await api.delete(`/plantilla/${id}`);
            return response;
        } catch (error) {
            throw error;
        }
    }
};
