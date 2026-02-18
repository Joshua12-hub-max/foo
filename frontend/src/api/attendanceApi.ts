import api from './axios';
import { AxiosResponse } from 'axios';
import { AttendanceQueryValues } from '../schemas/attendanceSchema';

import { DTRApiResponse, AttendanceLogApiResponse } from '../types/attendance';
import { MonitorLogData } from '../types';

interface AttendanceLogResponse {
    success: boolean;
    message: string;
    data: DTRApiResponse[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

interface RecentActivityResponse {
    success: boolean;
    data: DTRApiResponse[];
}

interface RawLogsResponse {
    success: boolean;
    data: AttendanceLogApiResponse[];
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
    getLogs: async (params: AttendanceQueryValues): Promise<AxiosResponse<AttendanceLogResponse>> => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.employeeId) queryParams.append('employeeId', params.employeeId);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        if (params.department) queryParams.append('department', params.department);
        if (params.search) queryParams.append('search', params.search);

        return await api.get('/attendance/logs', { params: queryParams });
    },
    getRecentActivity: async (): Promise<AxiosResponse<RecentActivityResponse>> => {
        return await api.get('/attendance/recent-activity');
    },
    getRawLogs: async (params?: AttendanceQueryValues): Promise<AxiosResponse<RawLogsResponse>> => {
        const queryParams = new URLSearchParams();
        if (params) {
            if (params.page) queryParams.append('page', params.page.toString());
            if (params.limit) queryParams.append('limit', params.limit.toString());
            if (params.employeeId) queryParams.append('employeeId', params.employeeId);
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);
            if (params.department) queryParams.append('department', params.department);
            if (params.search) queryParams.append('search', params.search);
        }
        return await api.get('/attendance/raw-logs', { params: queryParams });
    },
    getTodayStatus: async (employeeId?: string): Promise<AxiosResponse<AttendanceActionResponse>> => {
        return await api.get('/attendance/today-status', { params: { employeeId } });
    },
    getDashboardStats: async (): Promise<AxiosResponse> => {
        return await api.get('/attendance/dashboard-stats');
    }
};
