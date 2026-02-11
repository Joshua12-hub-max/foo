import api from './axios';
import { AxiosResponse } from 'axios';
import { AttendanceQueryValues } from '../schemas/attendanceSchema';

import { AttendanceRecord } from '../types';

interface AttendanceLogResponse {
    success: boolean;
    message: string;
    data: AttendanceRecord[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface AttendanceActionResponse {
    success: boolean;
    message: string;
    data: {
        timeIn: string | null;
        timeOut: string | null;
        status?: string;
    };
}

// Ensure strict return types
export const attendanceApi = {
    clockIn: async (): Promise<AxiosResponse<AttendanceActionResponse>> => {
        return await api.post('/attendance/clock-in');
    },
    clockOut: async (): Promise<AxiosResponse<AttendanceActionResponse>> => {
        return await api.post('/attendance/clock-out');
    },
    getLogs: async (params: AttendanceQueryValues): Promise<AxiosResponse<AttendanceLogResponse>> => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.employeeId) queryParams.append('employeeId', params.employeeId);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        return await api.get('/attendance/logs', { params: queryParams });
    },
    getRecentActivity: async (): Promise<AxiosResponse<AttendanceLogResponse>> => {
        return await api.get('/attendance/recent-activity');
    },
    getRawLogs: async (): Promise<AxiosResponse<AttendanceLogResponse>> => {
        return await api.get('/attendance/raw-logs');
    },
    getTodayStatus: async (employeeId?: string): Promise<AxiosResponse<AttendanceActionResponse>> => {
        return await api.get('/attendance/today-status', { params: { employeeId } });
    },
    getDashboardStats: async (): Promise<AxiosResponse> => {
        return await api.get('/attendance/dashboard-stats');
    }
};
