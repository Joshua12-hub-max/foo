import api from './axios';

export const undertimeApi = {
    // Employee applies for undertime
    applyUndertime: async (data) => {
        try {
            const response = await api.post('/undertime/apply', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    
    // Alias for applyUndertime (used by hooks) - sends FormData for file upload
    submitRequest: async (data) => {
        try {
            const formData = new FormData();
            formData.append('date', data.date);
            formData.append('timeOut', data.timeOut);
            formData.append('reason', data.reason);
            
            if (data.attachment) {
                formData.append('attachment', data.attachment);
            }
            
            const response = await api.post('/undertime/apply', formData);
            return response;
        } catch (error) {
            throw error;
        }
    },
    
    // Get current employee's undertime requests
    getMyRequests: async () => {
        try {
            const response = await api.get('/undertime/my-requests');
            return response;
        } catch (error) {
            throw error;
        }
    },
    
    // Employee cancels pending request
    cancelRequest: async (id) => {
        try {
            const response = await api.put(`/undertime/${id}/cancel`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    
    // Admin gets all requests
    getAllRequests: async () => {
        try {
            const response = await api.get('/undertime/all');
            return response;
        } catch (error) {
            throw error;
        }
    },
    
    // Admin approves request
    approveRequest: async (id) => {
        try {
            const response = await api.put(`/undertime/${id}/approve`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    
    // Admin rejects request
    rejectRequest: async (id, reason) => {
        try {
            const response = await api.put(`/undertime/${id}/reject`, { reason });
            return response;
        } catch (error) {
            throw error;
        }
    }
};
