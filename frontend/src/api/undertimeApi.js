import api from './axios';

export const undertimeApi = {
    applyUndertime: async (data) => {
        try {
            const response = await api.post('/undertime/apply', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    getAllRequests: async () => {
        try {
            const response = await api.get('/undertime/all');
            return response;
        } catch (error) {
            throw error;
        }
    },
    approveRequest: async (id) => {
        try {
            const response = await api.put(`/undertime/${id}/approve`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    rejectRequest: async (id, reason) => {
        try {
            const response = await api.put(`/undertime/${id}/reject`, { reason });
            return response;
        } catch (error) {
            throw error;
        }
    }
};
