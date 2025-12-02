import api from './axios';

export const leaveApi = {
    // data should be FormData object if containing file
    applyLeave: async (data) => {
        try {
            // Axios handles Content-Type: multipart/form-data if data is FormData
            const response = await api.post('/leave/apply', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    getMyLeaves: async () => {
        try {
            const response = await api.get('/leave/my-leaves');
            return response;
        } catch (error) {
            throw error;
        }
    },
    getAllLeaves: async () => {
        try {
            const response = await api.get('/leave/all');
            return response;
        } catch (error) {
            throw error;
        }
    },
    getCredits: async (employeeId) => {
        try {
            const response = await api.get(`/leave/credits/${employeeId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    getMyCredits: async () => {
        try {
            const response = await api.get('/leave/my-credits');
            return response;
        } catch (error) {
            throw error;
        }
    },
    getAllCredits: async () => {
        try {
            const response = await api.get('/leave/credits/all');
            return response;
        } catch (error) {
            throw error;
        }
    },
    addOrUpdateCredit: async (data) => {
        try {
            const response = await api.post('/leave/credits', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    approveLeave: async (id) => {
        try {
            const response = await api.put(`/leave/${id}/approve`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    rejectLeave: async (id, reason) => {
        try {
            const response = await api.put(`/leave/${id}/reject`, { reason });
            return response;
        } catch (error) {
            throw error;
        }
    },
    // Admin processes and uploads form
    processLeave: async (id, formData) => {
        try {
            const response = await api.put(`/leave/${id}/process`, formData);
            return response;
        } catch (error) {
            throw error;
        }
    },
    // Employee uploads signed form
    finalizeLeave: async (id, formData) => {
        try {
            const response = await api.put(`/leave/${id}/finalize`, formData);
            return response;
        } catch (error) {
            throw error;
        }
    }
};
