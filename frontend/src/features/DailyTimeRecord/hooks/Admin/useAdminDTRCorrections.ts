import { useState, useEffect, useCallback } from 'react';
import { dtrApi } from '@api/dtrApi';
import { DTRCorrectionRequest } from '@/types/attendance';

export const useAdminDTRCorrections = () => {
    const [requests, setRequests] = useState<DTRCorrectionRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('Pending');

    const fetchRequests = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await dtrApi.getCorrectionRequests(filterStatus);
            if (response.data.success) {
                setRequests(response.data.data as DTRCorrectionRequest[]);
            }
        } catch (err) {
            console.error('Failed to fetch correction requests:', err);
            setError('Failed to load correction requests.');
        } finally {
            setIsLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const updateStatus = async (ids: number[], status: 'Approved' | 'Rejected', rejectionReason?: string) => {
        setIsLoading(true);
        try {
            const response = await dtrApi.updateCorrectionStatus(ids, status, rejectionReason);
            if (response.data.success) {
                await fetchRequests(); // Refresh list
                return { success: true, message: response.data.message };
            }
            return { success: false, message: 'Operation failed' };
        } catch (err: unknown) {
            console.error('Failed to update status:', err);
            const error = err as { response?: { data?: { message?: string } } };
            return { 
                success: false, 
                message: error.response?.data?.message || 'Failed to update status' 
            };
        } finally {
            setIsLoading(false);
        }
    };


    return {
        requests,
        isLoading,
        error,
        filterStatus,
        setFilterStatus,
        refresh: fetchRequests,
        updateStatus
    };
};
