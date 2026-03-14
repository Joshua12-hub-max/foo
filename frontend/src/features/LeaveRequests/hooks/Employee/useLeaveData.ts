import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from "@/api/leaveApi";
import { EmployeeLeaveRequest } from '../../types';
import type { LeaveApplication, ApplicationStatus } from '@/types/leave.types';

export const useLeaveData = (initialFilters?: Record<string, string>) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<{
    search: string;
    startDate: string;
    endDate: string;
    status: ApplicationStatus | '';
    type: string;
  }>({
    search: '',
    startDate: '',
    endDate: '',
    status: '' as ApplicationStatus | '',
    type: ''
  });

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['employee-leaves', page, limit, filters],
    queryFn: async () => {
      const params = {
        page,
        limit,
        search: filters.search,
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status
      };
      
      const response = await leaveApi.getMyApplications(params);
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

  const refreshLeaves = async () => {
    await queryClient.invalidateQueries({ queryKey: ['employee-leaves'] });
  };

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return { 
    leaves: data?.leaves || [], 
    pagination: data?.pagination || { page: 1, limit: 10, totalPages: 1, totalItems: 0 },
    loading, 
    error: error ? (error as Error).message : null, 
    refreshLeaves,
    setPage,
    updateFilters
  };
};
