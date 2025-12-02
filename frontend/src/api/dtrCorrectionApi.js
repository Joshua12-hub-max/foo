import api from './axios';

export const dtrCorrectionApi = {
    submitEmployeeCorrection: async (data) => {
        try {
            const response = await api.post('/dtr-corrections/create', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    getMyCorrections: async () => {
        try {
            const response = await api.get('/dtr-corrections/my-corrections');
            return response;
        } catch (error) {
            throw error;
        }
    },
    getAllCorrections: async () => {
        try {
            const response = await api.get('/dtr-corrections/all');
            return response;
        } catch (error) {
            throw error;
        }
    },
    approveCorrection: async (id, reason) => {
        try {
            const response = await api.put(`/dtr-corrections/${id}/approve`, { reason });
            return response;
        } catch (error) {
            throw error;
        }
    },
    rejectCorrection: async (id, reason) => {
        try {
            const response = await api.put(`/dtr-corrections/${id}/reject`, { reason });
            return response;
        } catch (error) {
            throw error;
        }
    },
    updateCorrectionByAdmin: async (id, data, source) => {
        try {
            const response = await api.put(`/dtr-corrections/${id}/update`, { ...data, source });
            return response;
        } catch (error) {
            throw error;
        }
    }
};
