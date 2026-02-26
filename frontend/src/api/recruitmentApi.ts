import api from './axios';
import { AxiosResponse } from 'axios';
import { JobFormData, Job } from '@/types';
import type { Applicant, Interviewer, ApplicantStage, ApplicantStatus } from '@/types/recruitment';

export const recruitmentApi = {
    // Jobs
    getJobs: async (params: Record<string, string | number | boolean | undefined> & { page?: number; search?: string; status?: string; public_view?: boolean }): Promise<AxiosResponse<{ success: boolean; jobs: Job[]; total?: number; message?: string }>> => {
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
    createJob: async (data: JobFormData | FormData): Promise<AxiosResponse> => {
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
    updateJob: async (id: string | number, data: JobFormData | FormData): Promise<AxiosResponse> => {
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
    getApplicants: async (params?: { job_id?: number | string; stage?: string; source?: string }): Promise<AxiosResponse<{ applicants: Applicant[] }>> => {
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
    updateApplicantStage: async (id: string | number, data: { stage: ApplicantStage }): Promise<AxiosResponse> => {
        try {
            const response = await api.put(`/recruitment/applicants/${id}/stage`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    
    // Email Applications
    checkEmails: async (): Promise<AxiosResponse<{ success: boolean; processed: number; errors: string[] }>> => {
        try {
            const response = await api.post('/recruitment/check-emails');
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Interviewer Management
    getInterviewers: async (): Promise<AxiosResponse<Interviewer[]>> => {
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
        stage: ApplicantStage;
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
    getApplicantStats: async (): Promise<AxiosResponse<{
        total: number;
        new: number;
        interviewing: number;
        hired: number;
        rejected: number;
        stats: Array<{ stage: string; count: number }>;
    }>> => {
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
