import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complianceApi, type BudgetAllocation, type BudgetSummary, type DepartmentBudget } from '@/api/complianceApi';
import { useToastStore } from '@/stores';

export interface UseBudgetReturn {
  // State
  year: number;
  setYear: (year: number) => void;
  loading: boolean;
  error: Error | null;
  
  // Data
  allocations: BudgetAllocation[];
  summary: BudgetSummary | null;
  departmentBudgets: DepartmentBudget[];
  
  createAllocation: (data: { year: number; department: string; totalBudget: number; notes?: string }) => Promise<void>;
  updateAllocation: (id: number, data: { totalBudget?: number; notes?: string }) => Promise<void>;
  recalculate: (year: number, department: string) => Promise<void>;
  
  // Helpers
  refresh: () => void;
}

export const useBudget = (initialYear: number = new Date().getFullYear()): UseBudgetReturn => {
  const [year, setYear] = useState<number>(initialYear);
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  // Fetch all allocations for the selected year
  const { 
    data: allocationsData, 
    isLoading: loadingAllocations, 
    error: allocationsError,
    refetch: refetchAllocations
  } = useQuery({
    queryKey: ['budget-allocations', year],
    queryFn: async () => {
      const response = await complianceApi.budgetAllocation.getAll({ year });
      return response.data.allocations;
    }
  });

  // Fetch summary for the selected year
  const { 
    data: summaryData, 
    isLoading: loadingSummary, 
    error: summaryError,
    refetch: refetchSummary
  } = useQuery({
    queryKey: ['budget-summary', year],
    queryFn: async () => {
      const response = await complianceApi.budgetAllocation.getSummary(year);
      return response.data;
    }
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: { year: number; department: string; totalBudget: number; notes?: string }) => 
      complianceApi.budgetAllocation.create(data),
    onSuccess: () => {
      showToast('Budget allocation created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['budget-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
    },
    onError: (error: Error) => {
      showToast(error.message || 'Failed to create budget allocation', 'error');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: { totalBudget?: number; notes?: string } }) => 
      complianceApi.budgetAllocation.update(id, data),
    onSuccess: () => {
      showToast('Budget allocation updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['budget-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
    },
    onError: (error: Error) => {
      showToast(error.message || 'Failed to update budget allocation', 'error');
    }
  });

  // Recalculate mutation
  const recalculateMutation = useMutation({
    mutationFn: ({ year, department }: { year: number; department: string }) => 
      complianceApi.budgetAllocation.recalculate(year, department),
    onSuccess: () => {
      showToast('Budget recalculated successfully', 'info');
      queryClient.invalidateQueries({ queryKey: ['budget-allocations'] });
      queryClient.invalidateQueries({ queryKey: ['budget-summary'] });
    }
  });

  const refresh = useCallback(() => {
    refetchAllocations();
    refetchSummary();
  }, [refetchAllocations, refetchSummary]);

  return {
    year,
    setYear,
    loading: loadingAllocations || loadingSummary,
    error: (allocationsError as Error) || (summaryError as Error) || null,
    allocations: allocationsData || [],
    summary: summaryData?.summary || null,
    departmentBudgets: summaryData?.byDepartment || [],
    createAllocation: async (data) => { await createMutation.mutateAsync(data); },
    updateAllocation: async (id, data) => { await updateMutation.mutateAsync({ id, data }); },
    recalculate: async (year, department) => { await recalculateMutation.mutateAsync({ year, department }); },
    refresh
  };
};
