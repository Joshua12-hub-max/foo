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
    postJobToTelegram: async (id) => {
        try {
            const response = await api.post(`/recruitment/jobs/${id}/telegram`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    postJobToLinkedIn: async (id) => {
        try {
            const response = await api.post(`/recruitment/jobs/${id}/linkedin`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    postJobToFacebook: async (id) => {
        try {
            const response = await api.post(`/recruitment/jobs/${id}/facebook`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    testFacebookConnection: async () => {
        try {
            const response = await api.get('/recruitment/facebook/test');
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
    },
    
    // Email Applications
    checkEmails: async () => {
        try {
            const response = await api.post('/recruitment/check-emails');
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Interviewer Management
    getInterviewers: async () => {
        try {
            const response = await api.get('/recruitment/interviewers');
            return response;
        } catch (error) {
            throw error;
        }
    },
    assignInterviewer: async (applicantId, interviewerId) => {
        try {
            const response = await api.put(`/recruitment/applicants/${applicantId}/assign-interviewer`, { interviewerId });
            return response;
        } catch (error) {
            throw error;
        }
    },
    updateStage: async (applicantId, data) => {
        try {
            const response = await api.put(`/recruitment/applicants/${applicantId}/stage`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    getApplicantStats: async () => {
        try {
            const response = await api.get('/recruitment/applicant-stats');
            return response;
        } catch (error) {
            throw error;
        }
    }
};
