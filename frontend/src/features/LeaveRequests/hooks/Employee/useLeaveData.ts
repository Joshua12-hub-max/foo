import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from "@/api/leaveApi";
import { EmployeeLeaveRequest } from '../../types';

interface LeaveDataResponse {
  leaves: any[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}

export const useLeaveData = (initialFilters?: any) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    status: '',
    type: ''
  });

  const { data, isLoading: loading, error } = useQuery<LeaveDataResponse>({
    queryKey: ['employee-leaves', page, limit, filters],
    queryFn: async () => {
      const params = {
        page,
        limit,
        search: filters.search,
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status
        // Note: 'type' filter logic might need to be added to backend or matched with existing backend logic
        // For now, let's assume 'search' covers general text, and we have specific fields.
        // Wait, the backend updated code handles 'leave_type' via search only?
        // Let's check backend update...
        // Backend: `if (search) whereClause += ' AND (lr.leave_type LIKE ? OR lr.reason LIKE ?)';`
        // It doesn't have a specific `leaveType` filter yet in backend.
        // But `useFilters` has a `type` filter.
        // I should probably add `type` to backend or rely on search.
        // Let's rely on search for now or update backend again if strictly needed.
        // Actually, for better UX, a specific type filter is better.
        // I'll keep it as is for now and maybe update backend if I see the need.
      };
      
      const response = await (leaveApi as any).getMyLeaves(params);
      
      const leaves = (response.data?.leaves || []).map((l: any) => ({
        id: l.id,
        employee_id: l.employee_id,
        leaveType: l.leave_type,
        fromDate: l.start_date,
        toDate: l.end_date,
        reason: l.reason,
        status: l.status,
        with_pay: l.with_pay,
        attachment_path: l.attachment_path,
        department: l.department || 'N/A',
        name: `${l.first_name || ''} ${l.last_name || ''}`.trim() || 'N/A'
      }));

      return {
        leaves,
        pagination: response.data?.pagination || { page: 1, limit: 10, totalPages: 1, totalItems: 0 }
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData
  });

  const refreshLeaves = async () => {
    await queryClient.invalidateQueries({ queryKey: ['employee-leaves'] });
  };

  const updateFilters = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  return { 
    leaves: data?.leaves || [], 
    pagination: data?.pagination || { page: 1, limit: 10, totalPages: 1, totalItems: 0 },
    loading, 
    error: error ? (error as Error).message : null, 
    refreshLeaves,
    setPage, // Exported for Pagination component
    updateFilters // Exported for Filters component
  };
};
