import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dtrApi } from '../api/dtrApi';
import { DTRQueryValues, UpdateDTRValues } from '@/schemas/dtrSchema';
import { useToastStore } from '@/stores';

export const useDTRLogs = (filters: DTRQueryValues) => {
    return useQuery({
        queryKey: ['dtrRecords', filters],
        queryFn: () => dtrApi.getAllRecords(filters),
    });
};

export const useUpdateDTR = () => {
    const queryClient = useQueryClient();
    const showToast = useToastStore((state) => state.showToast);

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateDTRValues }) => dtrApi.updateRecord(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dtrRecords'] });
            showToast('DTR Record updated successfully', 'success');
        },
        onError: (error: any) => {
            showToast(error.response?.data?.message || 'Failed to update DTR record', 'error');
        }
    });
};
