import api from './axios';

export const attendanceApi = {
    clockIn: async (data) => {
        try {
            const response = await api.post('/attendance/clock-in', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    clockOut: async (data) => {
        try {
            const response = await api.post('/attendance/clock-out', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    getLogs: async (params) => {
        try {
            const response = await api.get('/attendance/logs', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },
    getRecentActivity: async () => {
        try {
            const response = await api.get('/attendance/recent-activity');
            return response;
        } catch (error) {
            throw error;
        }
    },
    getTodayStatus: async () => {
        try {
            const response = await api.get('/attendance/today-status');
            return response;
        } catch (error) {
            throw error;
        }
    }
};