import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { leaveApi } from '@api/leaveApi';
import { employeeApi } from '@api/employeeApi';
import { toast } from 'react-hot-toast';
import { usePagination } from '@/hooks/usePagination';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';
import { LeaveCredit } from '../../types';
import type { CreditType } from '@/types/leave.types';

export const useCredits = () => {
  const queryClient = useQueryClient();
  
  // Use Centralized Pagination Hook
  const { 
    page, setPage, 
    limit, setLimit, 
    search, setSearch,
    onPageChange, onSearchChange 
  } = usePagination();

  // Use Centralized Paginated Query Hook
  const creditsQuery = usePaginatedQuery({
    queryKey: ['leave-credits', page, limit, search],
    queryFn: async () => {
      // Default to current year or 2026 if not set
      const year = new Date().getFullYear();
      console.log('Fetching credits for year:', year);
      const res = await leaveApi.getAllCredits({ page, limit, search, year });
      console.log('Credits fetched:', res.data?.credits);
      return {
        data: (res.data?.credits || []) as LeaveCredit[],
        pagination: res.data?.pagination || { page: 1, limit: 10, totalPages: 1, totalItems: 0 }
      };
    }
  });

  // Fetch employees for add credit modal
  const employeesQuery = useQuery({
    queryKey: ['employees-options'],
    queryFn: async () => {
      const res = await employeeApi.fetchEmployees();
      const raw = res.employees || [];
      return raw.map((e) => ({
        ...e,
        employee_id: String(e.employee_id || e.id),
        first_name: e.first_name || '',
        last_name: e.last_name || ''
      }));
    },

  });

  // Update or Add Credit mutation
  const updateCreditMutation = useMutation({
    mutationFn: async ({ employeeId, creditType, balance }: { employeeId: string; creditType: string; balance: number }) => {
      const res = await leaveApi.updateCredit(employeeId, { creditType: creditType as CreditType, balance });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-credits'] });
      toast.success('Leave credit updated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to update leave credit');
    },
  });

  // Delete Credit mutation
  const deleteCreditMutation = useMutation({
    mutationFn: async ({ employeeId, creditType }: { employeeId: string; creditType: string }) => {
      const res = await leaveApi.deleteCredit(employeeId, creditType);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-credits'] });
      toast.success('Leave credit deleted successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to delete leave credit');
    },
  });

  return {
    // Data & Pagination
    credits: creditsQuery.data?.data || [], // Note: standardizing to 'data' property
    pagination: creditsQuery.data?.pagination || { page: 1, limit: 10, totalPages: 1, totalItems: 0 },
    
    // Pagination Controls
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    onPageChange,
    onSearchChange,

    // Status
    isLoading: creditsQuery.isLoading,
    isError: creditsQuery.isError,
    error: creditsQuery.error,

    // Other Queries/Mutations
    employees: employeesQuery.data || [],
    isLoadingEmployees: employeesQuery.isLoading,
    updateCredit: updateCreditMutation.mutateAsync,
    isUpdating: updateCreditMutation.isPending,
    deleteCredit: deleteCreditMutation.mutateAsync,
    isDeleting: deleteCreditMutation.isPending,
  };
};


