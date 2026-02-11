import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetAllocationApi, type BudgetAllocation } from '@/api/complianceApi';
import { toast } from 'react-hot-toast';

export const budgetKeys = {
  all: ['budget-allocation'] as const,
  lists: () => [...budgetKeys.all, 'list'] as const,
  list: (filters: any) => [...budgetKeys.lists(), filters] as const,
  summary: (year: number) => [...budgetKeys.all, 'summary', year] as const,
};

export const useBudgetAllocations = (params?: { year?: number; department?: string }) => {
  return useQuery({
    queryKey: budgetKeys.list(params || {}),
    queryFn: async () => {
      const response = await budgetAllocationApi.getAll(params);
      return response.data.allocations;
    },
  });
};

export const useBudgetSummary = (year: number) => {
  return useQuery({
    queryKey: budgetKeys.summary(year),
    queryFn: async () => {
      const response = await budgetAllocationApi.getSummary(year);
      return response.data;
    },
    enabled: !!year,
  });
};

export const useCreateBudgetAllocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { year: number; department: string; totalBudget: number; notes?: string }) => {
      const response = await budgetAllocationApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      toast.success('Budget allocation created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create budget allocation');
    },
  });
};

export const useUpdateBudgetAllocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { totalBudget?: number; notes?: string } }) => {
      const response = await budgetAllocationApi.update(id, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      toast.success('Budget allocation updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update budget allocation');
    },
  });
};

export const useRecalculateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ year, department }: { year: number; department: string }) => {
      const response = await budgetAllocationApi.recalculate(year, department);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      toast.success('Budget utilization recalculated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to recalculate budget');
    },
  });
};
