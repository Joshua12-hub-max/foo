import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from "@/api/leaveApi";
import { EmployeeLeaveRequest } from '../../types';
import type { LeaveApplication } from '@/types/leave.types';
import { useLeaveStore } from '@/stores/leaveStore';

export const useLeaveData = () => {
  const queryClient = useQueryClient();
  const { filters, pagination, searchQuery, getQuery, setPage, setLimit, setFilters } = useLeaveStore();
  
  const queryParams = useMemo(() => getQuery(), [filters, pagination.page, pagination.limit, searchQuery, getQuery]);

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['employee-leaves', queryParams],
    queryFn: async () => {
      const response = await leaveApi.getMyApplications(queryParams);
      const rawLeaves = response.data?.applications || [];
      
      const leaves: EmployeeLeaveRequest[] = rawLeaves.map((l: LeaveApplication) => ({
        id: l.id,
        employeeId: l.employeeId || 'Missing',
        leaveType: l.leaveType,
        startDate: l.startDate,
        endDate: l.endDate,
        reason: l.reason,
        status: l.status,
        isWithPay: !!l.isWithPay,
        workingDays: l.workingDays,
        attachmentPath: l.attachmentPath,
        adminFormPath: l.adminFormPath,
        finalAttachmentPath: l.finalAttachmentPath,
        department: l.department || 'N/A',
        firstName: l.firstName || '',
        lastName: l.lastName || '',
      }));

      return {
        leaves,
        pagination: response.data?.pagination || { page: 1, limit: 10, totalPages: 1, totalItems: 0 }
      };
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData
  });

  const refreshLeaves = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['employee-leaves'] });
  }, [queryClient]);

  const updateFilters = useCallback((newFilters: any) => {
    setFilters(newFilters);
  }, [setFilters]);

  return { 
    leaves: data?.leaves || [], 
    pagination: data?.pagination || { page: 1, limit: 10, totalPages: 1, totalItems: 0 },
    loading, 
    error: error ? (error as Error).message : null, 
    refreshLeaves,
    setPage,
    setLimit,
    updateFilters
  };
};

