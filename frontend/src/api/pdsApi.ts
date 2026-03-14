import api from './axios';
import { AxiosResponse } from 'axios';

// Interfaces for PDS Sections (simplified for now, strictly keyed)
export interface PDSFamily {
  id?: number;
  spouseLastName?: string;
  spouseFirstName?: string;
  spouseMiddleName?: string;
  children?: { name: string; birthDate: string }[]; // Example structure if JSON, but likely separate rows
  // ... maps to database schema
}

export interface PDSEducation {
    id?: number;
    level: 'Elementary' | 'Secondary' | 'Vocational' | 'College' | 'Graduate Studies';
    schoolName: string;
    degreeCourse?: string;
    yearGraduated?: number;
    unitsEarned?: string;
    dateFrom?: number;
    dateTo?: number;
    honors?: string;
}

// ... other interfaces can be added as needed

export const pdsApi = {
    // Get PDS Section
    getSection: async <T>(section: string, employeeId?: number): Promise<AxiosResponse<{ success: boolean; data: T[] }>> => {
        return await api.get(`/pds/${section}`, { params: { employeeId } });
    },

    // Update PDS Section (Full Replace Strategy per Controller)
    updateSection: async <T>(section: string, items: T[], employeeId?: number): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        return await api.put(`/pds/${section}`, { items, employeeId });
    }
};
