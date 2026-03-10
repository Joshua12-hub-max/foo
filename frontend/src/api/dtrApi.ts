import api from './axios';
import { AxiosResponse } from 'axios';
import { DTRQueryValues, UpdateDTRValues } from '../schemas/dtrSchema';

import { DTRApiResponse } from '../types/attendance';

interface DTRResponse {
    success: boolean;
    data: DTRApiResponse[];
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
        return await api.get('/dtr/all', { params: queryParams });
    },

    updateRecord: async (id: string, data: UpdateDTRValues): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
        return await api.put(`/dtr/${id}`, data);
    },

    requestCorrection: async (data: { employeeId: string | number; date: string; originalTimeIn?: string | null; originalTimeOut?: string | null; correctedTimeIn?: string | null; correctedTimeOut?: string | null; reason: string; }) => {
        return await api.post('/dtr/request', data);
    },

    getCorrectionRequests: async (status?: string) => {
        return await api.get('/dtr/corrections', { params: { status } });
    },

    updateCorrectionStatus: async (ids: number[], status: 'Approved' | 'Rejected', rejectionReason?: string) => {
        return await api.patch('/dtr/corrections/status', { ids, status, rejectionReason });
    },
};
