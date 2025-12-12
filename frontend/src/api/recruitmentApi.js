import api from './axios';

export const recruitmentApi = {
    // Jobs
    getJobs: async (params) => {
        try {
            const response = await api.get('/recruitment/jobs', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },
    getJob: async (id) => {
        try {
            const response = await api.get(`/recruitment/jobs/${id}`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    createJob: async (data) => {
        try {
            const response = await api.post('/recruitment/jobs', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    deleteJob: async (id) => {
        try {
            const response = await api.delete(`/recruitment/jobs/${id}`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    updateJob: async (id, data) => {
        try {
            const response = await api.put(`/recruitment/jobs/${id}`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    markAsPosted: async (id, platform) => {
        try {
            const response = await api.put(`/recruitment/jobs/${id}/posted`, { platform });
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Applicants
    getApplicants: async (params) => {
        try {
            const response = await api.get('/recruitment/applicants', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },
    applyJob: async (formData) => {
        try {
            const response = await api.post('/recruitment/apply', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response;
        } catch (error) {
            throw error;
        }
    },
    updateApplicantStage: async (id, data) => {
        try {
            const response = await api.put(`/recruitment/applicants/${id}/stage`, data);
            return response;
        } catch (error) {
            throw error;
        }
    }
};
