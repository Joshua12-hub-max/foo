import api from './axios';

export const plantillaApi = {
    // Get all positions with incumbent details
    getPositions: async (params) => {
        try {
            const response = await api.get('/plantilla', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get summary statistics
    getSummary: async () => {
        try {
            const response = await api.get('/plantilla/summary');
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Create position
    createPosition: async (data) => {
        try {
            const response = await api.post('/plantilla', data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Update position
    updatePosition: async (id, data) => {
        try {
            const response = await api.put(`/plantilla/${id}`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Delete position
    deletePosition: async (id) => {
        try {
            const response = await api.delete(`/plantilla/${id}`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Assign employee to position
    assignEmployee: async (positionId, data) => {
        try {
            const response = await api.post(`/plantilla/${positionId}/assign`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Vacate position
    vacatePosition: async (positionId, data) => {
        try {
            const response = await api.post(`/plantilla/${positionId}/vacate`, data);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get position history
    getPositionHistory: async (positionId) => {
        try {
            const response = await api.get(`/plantilla/${positionId}/history`);
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get audit log
    getAuditLog: async (params) => {
        try {
            const response = await api.get('/plantilla/audit-log', { params });
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get available employees for assignment
    getAvailableEmployees: async () => {
        try {
            const response = await api.get('/plantilla/available-employees');
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Get salary schedule based on grade and step
    getSalarySchedule: async (grade, step) => {
        try {
            const response = await api.get('/plantilla/salary-schedule', { 
                params: { grade, step } 
            });
            return response;
        } catch (error) {
            throw error;
        }
    }
};
