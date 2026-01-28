import api from './axios';
import { AxiosResponse } from 'axios';
import { JobFormData, Job } from '@/types';

export const recruitmentApi = {
    // Jobs
    getJobs: async (params: { page?: number; search?: string; status?: string; public_view?: boolean; [key: string]: any }): Promise<AxiosResponse<{ success: boolean; data: any; jobs: Job[]; message?: string }>> => {
        try {
            const response = await api.get('/recruitment/jobs', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },
    getJob: async (id: string | number): Promise<AxiosResponse<{ success: boolean; job: Job }>> => {
        try {
            const response = await api.get(`/recruitment/jobs/${id}`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    createJob: async (data: JobFormData): Promise<AxiosResponse> => {
        try {
            const response = await api.post('/recruitment/jobs', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    deleteJob: async (id: string | number): Promise<AxiosResponse> => {
        try {
            const response = await api.delete(`/recruitment/jobs/${id}`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    updateJob: async (id: string | number, data: JobFormData): Promise<AxiosResponse> => {
        try {
            const response = await api.put(`/recruitment/jobs/${id}`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    markAsPosted: async (id: string | number, platform: string): Promise<AxiosResponse> => {
        try {
            const response = await api.put(`/recruitment/jobs/${id}/posted`, { platform });
            return response;
        } catch (error) {
            throw error;
        }
    },

    
    // Applicants
    getApplicants: async (params?: Record<string, unknown>): Promise<AxiosResponse<{ applicants: Array<{
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        phone_number?: string;
        job_title?: string;
        job_requirements?: string;
        job_department?: string;
        email_subject?: string;
        source?: string;
        stage: string;
        status?: string;
        resume_path?: string;
        interview_date?: string;
        interview_link?: string;
        interview_platform?: string;
        interviewer_id?: number;
        interviewer_name?: string;
        notes?: string;
        created_at?: string;
    }> }>> => {
        try {
            const response = await api.get('/recruitment/applicants', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },
    applyJob: async (formData: FormData): Promise<AxiosResponse> => {
        try {
            const response = await api.post('/recruitment/apply', formData);
            return response;
        } catch (error) {
            throw error;
        }
    },
    updateApplicantStage: async (id: string | number, data: { stage: string }): Promise<AxiosResponse> => {
        try {
            const response = await api.put(`/recruitment/applicants/${id}/stage`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    
    // Email Applications
    checkEmails: async (): Promise<AxiosResponse> => {
        try {
            const response = await api.post('/recruitment/check-emails');
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Interviewer Management
    getInterviewers: async (): Promise<AxiosResponse<Array<{
        id: number;
        first_name?: string;
        last_name?: string;
        name?: string;
        email: string;
        job_title?: string;
        department?: string;
    }>>> => {
        try {
            const response = await api.get('/recruitment/interviewers');
            return response;
        } catch (error) {
            throw error;
        }
    },
    assignInterviewer: async (applicantId: string | number, interviewerId: string | number): Promise<AxiosResponse> => {
        try {
            const response = await api.put(`/recruitment/applicants/${applicantId}/assign-interviewer`, { interviewerId });
            return response;
        } catch (error) {
            throw error;
        }
    },
    updateStage: async (applicantId: string | number, data: { 
        stage: string;
        interview_date?: string;
        interview_link?: string;
        interview_platform?: string;
        notes?: string;
    }): Promise<AxiosResponse> => {
        try {
            const response = await api.put(`/recruitment/applicants/${applicantId}/stage`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    getApplicantStats: async (): Promise<AxiosResponse> => {
        try {
            const response = await api.get('/recruitment/applicant-stats');
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Meeting Link Generation
    generateMeetingLink: async (applicantId: number, date: string, duration?: number): Promise<AxiosResponse<{
        success: boolean;
        meetingLink?: string;
        meetingId?: string;
        message?: string;
    }>> => {
        try {
            const response = await api.post('/recruitment/generate-meeting-link', {
                applicantId,
                date,
                duration: duration || 60
            });
            return response;
        } catch (error) {
            throw error;
        }
    }
};
