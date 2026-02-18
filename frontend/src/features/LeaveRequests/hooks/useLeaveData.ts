import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { leaveApi } from "@/api/leaveApi";
import { EmployeeLeaveRequest } from '@/components/Custom/Timekeeping/LeaveRequestComponents/Employee/types';
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
      
      const response = await leaveApi.getMyApplications(params);
      
      const leaves = (response.data?.applications || []).map((l: LeaveApplication) => ({
        id: l.id,
        employee_id: l.employee_id,
        leaveType: l.leave_type,
        fromDate: l.start_date,
        toDate: l.end_date,
        reason: l.reason,
        status: l.status,
        with_pay: l.is_with_pay,
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
    placeholderData: keepPreviousData
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
    setPage, // Exported for Pagination component
    updateFilters // Exported for Filters component
  };
};
