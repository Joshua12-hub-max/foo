import api from './axios';
import { AxiosResponse } from 'axios';
import { DTRQueryValues, UpdateDTRValues } from '../schemas/dtrSchema';

interface DTRResponse {
    success: boolean;
    data: any[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const dtrApi = {
    getAllRecords: async (params: DTRQueryValues): Promise<AxiosResponse<DTRResponse>> => {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.employeeId) queryParams.append('employeeId', params.employeeId);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);

        return await api.get('/dtr', { params: queryParams });
    },

    updateRecord: async (id: string, data: UpdateDTRValues): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        return await api.put(`/dtr/${id}`, data);
    },
};
