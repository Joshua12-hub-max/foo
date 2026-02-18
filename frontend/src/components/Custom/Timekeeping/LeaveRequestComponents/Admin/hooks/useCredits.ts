import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { leaveApi } from '@api/leaveApi';
import { employeeApi } from '@api/employeeApi';
import { toast } from 'react-hot-toast';
import { usePagination } from '@/hooks/usePagination';
import { usePaginatedQuery } from '@/hooks/usePaginatedQuery';

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
      const res = await leaveApi.getAllCredits({ page, limit, search });
      return {
        data: res.data?.credits || [],
        pagination: res.data?.pagination || { page: 1, limit: 10, totalPages: 1, totalItems: 0 }
      };
    }
  });

  // Fetch employees for add credit modal
  const employeesQuery = useQuery({
    queryKey: ['employees-options'],
    queryFn: async () => {
      const res = await employeeApi.fetchEmployees();
      return res.employees || [];
    },
  });

  // Update or Add Credit mutation
  const updateCreditMutation = useMutation({
    mutationFn: async ({ employeeId, creditType, balance }: { employeeId: string; creditType: string; balance: number }) => {
      const res = await leaveApi.updateCredit(employeeId, { creditType, balance });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-credits'] });
      toast.success('Leave credit updated successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update leave credit';
      toast.error(message);
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
      const message = error instanceof Error ? error.message : 'Failed to delete leave credit';
      toast.error(message);
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


