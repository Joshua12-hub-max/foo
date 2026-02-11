import api from './axios';
import { AxiosResponse } from 'axios';

// Interfaces for PDS Sections (simplified for now, strictly keyed)
export interface PDSFamily {
  id?: number;
  spouse_last_name?: string;
  spouse_first_name?: string;
  spouse_middle_name?: string;
  children?: { name: string; birth_date: string }[]; // Example structure if JSON, but likely separate rows
  // ... maps to database schema
}

export interface PDSEducation {
    id?: number;
    level: string;
    school_name: string;
    degree_course?: string;
    year_graduated?: string;
    highest_level?: string;
    start_date?: string;
    end_date?: string;
    scholarship_honors?: string;
}

// ... other interfaces can be added as needed

export const pdsApi = {
    // Get PDS Section
    getSection: async <T>(section: string, employee_id?: number): Promise<AxiosResponse<{ success: boolean; data: T[] }>> => {
        try {
            const response = await api.get(`/pds/${section}`, { params: { employee_id } });
            return response;
        } catch (error) {
            throw error;
        }
    },

    // Update PDS Section (Full Replace Strategy per Controller)
    updateSection: async <T>(section: string, items: T[]): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        try {
            const response = await api.put(`/pds/${section}`, { items });
            return response;
        } catch (error) {
            throw error;
        }
    }
};
