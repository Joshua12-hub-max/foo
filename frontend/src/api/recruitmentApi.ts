import api from './axios';
import { AxiosResponse } from 'axios';
import { JobFormData, Job } from '@/types';
import type { Applicant, Interviewer, ApplicantStage } from '@/types/recruitment';

export interface SecurityLog {
    id: number;
    jobId: number | null;
    firstName: string;
    lastName: string;
    email: string;
    violationType: string;
    details: string | null;
    ipAddress: string | null;
    createdAt: string | null;
    jobTitle: string | null;
}

export const recruitmentApi = {
    // Jobs
    getJobs: async (params: Record<string, string | number | boolean | undefined> & { page?: number; search?: string; status?: string; publicView?: boolean }): Promise<AxiosResponse<{ success: boolean; jobs: Job[]; total?: number; message?: string }>> =>
        api.get('/recruitment/jobs', { params }),

    getJob: async (id: string | number): Promise<AxiosResponse<{ success: boolean; job: Job }>> =>
        api.get(`/recruitment/jobs/${id}`),

    createJob: async (data: JobFormData | FormData): Promise<AxiosResponse> =>
        api.post('/recruitment/jobs', data),

    deleteJob: async (id: string | number): Promise<AxiosResponse> =>
        api.delete(`/recruitment/jobs/${id}`),

    updateJob: async (id: string | number, data: JobFormData | FormData): Promise<AxiosResponse> =>
        api.put(`/recruitment/jobs/${id}`, data),

    markAsPosted: async (id: string | number, platform: string): Promise<AxiosResponse> =>
        api.put(`/recruitment/jobs/${id}/posted`, { platform }),

    // Applicants
    getApplicants: async (params?: { jobId?: number | string; stage?: string; source?: string }): Promise<AxiosResponse<{ success: boolean; applicants: Applicant[] }>> =>
        api.get('/recruitment/applicants', { params }),

    getHiredApplicantsByDuty: async <T = Applicant>(duty: 'Standard' | 'Irregular', department?: string): Promise<AxiosResponse<{ success: boolean; applicants: T[] }>> =>
        api.get('/recruitment/hired-by-duty', { params: { duty, department } }),

    applyJob: async (formData: FormData): Promise<AxiosResponse> =>
        api.post('/recruitment/apply', formData),

    updateApplicantStage: async (id: string | number, data: { stage: ApplicantStage }): Promise<AxiosResponse> =>
        api.put(`/recruitment/applicants/${id}/stage`, data),

    confirmApplicant: async (id: string | number, startDate: string, selectedDocs: string[] = [], customNotes: string = ''): Promise<AxiosResponse> =>
        api.post(`/recruitment/applicants/${id}/confirm`, { startDate, selectedDocs, customNotes }),

    deleteApplicant: async (id: string | number): Promise<AxiosResponse> =>
        api.delete(`/recruitment/applicants/${id}`),

    // Email Applications
    checkEmails: async (): Promise<AxiosResponse<{ success: boolean; processed: number; errors: string[] }>> =>
        api.post('/recruitment/check-emails'),

    // Interviewer Management
    getInterviewers: async (): Promise<AxiosResponse<Interviewer[]>> =>
        api.get('/recruitment/interviewers'),

    assignInterviewer: async (applicantId: string | number, interviewerId: string | number): Promise<AxiosResponse> =>
        api.put(`/recruitment/applicants/${applicantId}/assign-interviewer`, { interviewerId }),

    updateStage: async (applicantId: string | number, data: { 
        stage: ApplicantStage;
        interviewDate?: string;
        interviewLink?: string;
        interviewPlatform?: string;
        notes?: string;
    }): Promise<AxiosResponse> =>
        api.put(`/recruitment/applicants/${applicantId}/stage`, data),

    getApplicantStats: async (): Promise<AxiosResponse<{
        total: number;
        new: number;
        interviewing: number;
        hired: number;
        rejected: number;
        stats: Array<{ stage: string; count: number }>;
    }>> =>
        api.get('/recruitment/applicant-stats'),

    // Meeting Link Generation
    generateMeetingLink: async (applicantId: number, date: string, duration?: number): Promise<AxiosResponse<{
        success: boolean;
        meetingLink?: string;
        meetingId?: string;
        message?: string;
    }>> =>
        api.post('/recruitment/generate-meeting-link', {
            applicantId,
            date,
            duration: duration || 60
        }),

    // Security Audit
    getSecurityLogs: async (): Promise<AxiosResponse<{ success: boolean; logs: SecurityLog[] }>> =>
        api.get('/recruitment/security-logs'),
};
