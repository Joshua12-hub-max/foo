import api from './axios';

export const dtrApi = {
    getAllRecords: async () => {
        try {
            const response = await api.get('/dtr/all');
            return response;
        } catch (error) {
            throw error;
        }
    },
    // Add other methods as needed based on future requirements
    // getRecordById: (id) => api.get(`/dtr/${id}`),
    // createRecord: (data) => api.post('/dtr', data),
    // updateRecord: (id, data) => api.put(`/dtr/${id}`, data),
    // deleteRecord: (id) => api.delete(`/dtr/${id}`),
};
