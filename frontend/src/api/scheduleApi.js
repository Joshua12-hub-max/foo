import api from './axios';

export const scheduleApi = {
    getMySchedule: async () => {
        try {
            console.log('📡 [API] Calling GET /schedule/my-schedule');
            const response = await api.get('/schedule/my-schedule');
            console.log('📡 [API] Response received:', response.data);
            return response;
        } catch (error) {
            console.error('📡 [API] Error in getMySchedule:', error);
            console.error('📡 [API] Error response:', error.response?.data);
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
            console.log('Creating schedule with data:', data);
            const response = await api.post('/schedule/create', data);
            console.log('Schedule created successfully:', response.data);
            return response;
        } catch (error) {
            console.error('Error creating schedule:', error.response?.data || error.message);
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
