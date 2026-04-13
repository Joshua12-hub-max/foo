import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from "@api/leaveApi";
import { AdminLeaveRequest } from '../../types';
import type { LeaveApplication } from '@/types/leave.types';
import { formatFullName } from '@/utils/nameUtils';
import { useLeaveStore } from '@/stores/leaveStore';

interface AdminLeaveDataResponse {
  leaves: AdminLeaveRequest[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

export const useAdminLeaveData = () => {
  const queryClient = useQueryClient();
  
  const { filters, pagination, searchQuery, getQuery, setPage, setLimit } = useLeaveStore();
  const queryParams = useMemo(() => getQuery(), [filters, pagination.page, pagination.limit, searchQuery, getQuery]);

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['admin-leaves', queryParams],
    queryFn: async () => {
      const res = await leaveApi.getAllApplications(queryParams);
      
      const rawLeaves = res?.data?.applications;
      const leaves: AdminLeaveRequest[] = Array.isArray(rawLeaves) ? rawLeaves.map((l: LeaveApplication) => {
        // Build employee name with fallbacks
        const firstName = l.firstName || '';
        const lastName = l.lastName || '';
        const fullName = formatFullName(lastName, firstName).trim();
        const displayName = fullName || l.employeeId || 'Unknown Employee';

        return {
          id: l.id,
          employeeId: l.employeeId || 'Missing',
          firstName,
          lastName,
          name: displayName,
          department: l.department || 'N/A',
          leaveType: l.leaveType || 'N/A',
          startDate: l.startDate,
          endDate: l.endDate,
          reason: l.reason || '',
          status: l.status || 'Pending',
          isWithPay: l.isWithPay ?? true,
          attachmentPath: l.attachmentPath ?? undefined,
          adminFormPath: l.adminFormPath ?? undefined,
          finalAttachmentPath: l.finalAttachmentPath ?? undefined,
          workingDays: l.workingDays,
          currentBalance: l.currentBalance,
          daysWithPay: l.daysWithPay,
          daysWithoutPay: l.daysWithoutPay,
          actualPaymentStatus: l.actualPaymentStatus
        };
      }) : [];

      return {
        leaves,
        pagination: res.data.pagination
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData
  });

  const refreshLeaves = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-leaves'] });
  };

  const updateFilters = useCallback((newFilters: any) => {
    useLeaveStore.getState().setFilters(newFilters);
  }, []);

  return { 
    leaves: data?.leaves || [], 
    pagination: data?.pagination || { page: 1, limit: 10, totalPages: 1, totalItems: 0 },
    loading, 
    error: error ? (error as Error).message : null, 
    refreshLeaves,
    setPage,
    setLimit,
    updateFilters,
    filters // Expose current filters if needed
  };
};
