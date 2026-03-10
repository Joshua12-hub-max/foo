import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from "@api/leaveApi";
import { AdminLeaveRequest } from '../../types';
import type { LeaveApplication } from '@/types/leave.types';
import { formatFullName } from '@/utils/nameUtils';

interface AdminLeaveDataResponse {
  leaves: AdminLeaveRequest[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

export const useAdminLeaveData = (initialFilters?: Record<string, string>) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    department: '',
    employee: '',
    fromDate: '',
    toDate: ''
  });

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['admin-leaves', page, limit, filters],
    queryFn: async () => {
      const params = {
        page,
        limit,
        search: filters.search,
        department: filters.department,
        employeeId: filters.employee, // Mapping 'employee' (name) to backend param
        startDate: filters.fromDate,
        endDate: filters.toDate
      };
      const res = await leaveApi.getAllApplications(params);
      
      const rawLeaves = res?.data?.applications;
      const leaves: AdminLeaveRequest[] = Array.isArray(rawLeaves) ? rawLeaves.map((l: LeaveApplication) => {
        // Build employee name with fallbacks
        const firstName = l.firstName || '';
        const lastName = l.lastName || '';
        const fullName = formatFullName(lastName, firstName).trim();
        const displayName = fullName || l.employeeId || 'Unknown Employee';

        return {
          id: l.id,
          employeeId: l.employeeId || 'N/A',
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

  // Helper to update filters from the UI
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Reset to page 1 on filter change
  };

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
