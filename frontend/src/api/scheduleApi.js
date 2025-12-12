import api from './axios';

export const scheduleApi = {
    getMySchedule: async () => {
        try {
            const response = await api.get('/schedule/my-schedule');
            return response;
        } catch (error) {
            throw error;
        }
    },
    getAllSchedules: async () => {
        try {
            const response = await api.get('/schedule/all');
            return response;
        } catch (error) {
            throw error;
        }
    },
    createSchedule: async (data) => {
        try {
            const response = await api.post('/schedule/create', data);
            return response;
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to create schedule';
            throw new Error(errorMessage);
        }
    },
    updateSchedule: async (id, data) => {
        try {
            const response = await api.put(`/schedule/${id}`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },
    deleteSchedule: async (id) => {
        try {
            const response = await api.delete(`/schedule/${id}`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    getEmployeeSchedule: async (employeeId) => {
        try {
            const response = await api.get(`/schedule/employee/${employeeId}`);
            return response;
        } catch (error) {
            throw error;
        }
    },
    checkConflicts: async (data) => {
        try {
            const response = await api.post('/schedule/check-conflicts', data);
            return response;
        } catch (error) {
            throw error;
        }
    },
};
