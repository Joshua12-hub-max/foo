import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from "@api/leaveApi";
import { AdminLeaveRequest } from '../../types';

interface AdminLeaveDataResponse {
  leaves: any[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

export const useAdminLeaveData = (initialFilters?: any) => {
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

  const { data, isLoading: loading, error } = useQuery<AdminLeaveDataResponse>({
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
      const res = await (leaveApi as any).getAllLeaves(params);
      
      const rawLeaves = res?.data?.applications;
      const leaves = Array.isArray(rawLeaves) ? rawLeaves.map((l: any) => {
        // Build employee name with fallbacks
        const firstName = l.first_name || '';
        const lastName = l.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const displayName = fullName || l.employee_id || 'Unknown Employee';

        return {
          id: l.id,
          employee_id: l.employee_id || 'N/A',
          name: displayName,
          department: l.department || 'N/A',
          leaveType: l.leave_type || 'N/A',
          fromDate: l.start_date,
          toDate: l.end_date,
          reason: l.reason || '',
          status: l.status || 'Pending',
          with_pay: l.with_pay ?? true,
          attachment_path: l.attachment_path,
          final_attachment_path: l.final_attachment_path,
          first_name: firstName,
          last_name: lastName,
          leave_type: l.leave_type,
          start_date: l.start_date, // Ensuring date properties exist as expected by UI
          end_date: l.end_date,
          current_balance: l.current_balance
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
  const updateFilters = (newFilters: any) => {
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
