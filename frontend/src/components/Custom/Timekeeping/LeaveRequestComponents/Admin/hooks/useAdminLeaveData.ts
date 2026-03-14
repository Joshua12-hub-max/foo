import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { leaveApi } from "@api";
import { AdminLeaveRequest } from '@/components/Custom/Timekeeping/LeaveRequestComponents/Admin/types';
import { LeaveApplication } from '@/types/leave.types';
import { formatFullName } from '@/utils/nameUtils';

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
      
      const leaves = (res.data?.applications || []).map((l: LeaveApplication) => {
        // Build employee name with fallbacks
        const firstName = l.firstName || '';
        const lastName = l.lastName || '';
        const fullName = formatFullName(lastName, firstName).trim();
        const displayName = fullName || l.employeeId || 'Unknown Employee';

        return {
          id: l.id,
          employeeId: l.employeeId || 'N/A',
          name: displayName,
          department: l.department || 'N/A',
          leaveType: l.leaveType || 'N/A',
          fromDate: l.startDate,
          toDate: l.endDate,
          reason: l.reason || '',
          status: l.status || 'Pending',
          withPay: l.isWithPay ?? true,
          attachmentPath: l.attachmentPath,
          finalAttachmentPath: l.finalAttachmentPath,
          firstName: firstName,
          lastName: lastName,
          startDate: l.startDate, // Ensuring date properties exist as expected by UI
          endDate: l.endDate,
          currentBalance: undefined // Handle missing field if needed or use other from L
        };
      });

      return {
        leaves,
        pagination: res.data.pagination
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData // Keep data while fetching next page for smoother transition
  });

  const refreshLeaves = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-leaves'] });
  };

  // Helper to update filters from the UI
  const updateFilters = (newFilters: Record<string, string>) => {
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
