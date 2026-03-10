import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stepIncrementApi, type StepIncrement } from '@/api/complianceApi';
import { toast } from 'react-hot-toast';

// ==================== QUERY KEYS ====================

export const stepIncrementKeys = {
  all: ['step-increments'] as const,
  lists: () => [...stepIncrementKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...stepIncrementKeys.lists(), filters] as const,
  eligible: () => [...stepIncrementKeys.all, 'eligible'] as const,
};

// ==================== QUERIES ====================

export const useStepIncrements = (params?: { status?: string; employeeId?: number }) => {
  return useQuery({
    queryKey: stepIncrementKeys.list(params || {}),
    queryFn: async () => {
      try {
        const response = await stepIncrementApi.getAll(params);
        return response.data.increments || [];
      } catch (error) {
        console.error('Failed to fetch increments:', error);
        return [];
      }
    },
    staleTime: 0,
    refetchOnMount: true,
  });
};

export const useEligibleEmployees = () => {
  return useQuery({
    queryKey: stepIncrementKeys.eligible(),
    queryFn: async () => {
      try {
        const response = await stepIncrementApi.getEligible();
        return response.data;
      } catch (error) {
         console.error('Failed to fetch eligible employees:', error);
         return { eligibleEmployees: [], count: 0 };
      }
    },
    staleTime: 0,
    refetchOnMount: true,
  });
};

// ==================== MUTATIONS ====================

export const useCreateStepIncrement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      employeeId: number;
      positionId: number;
      currentStep: number;
      eligibleDate: string;
      status?: string;
      remarks?: string;
    }) => {
      const response = await stepIncrementApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stepIncrementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stepIncrementKeys.eligible() });
      toast.success('Step increment request created successfully');
    },
    onError: (error: unknown) => {
      const apiErr = error as { response?: { data?: { message?: string } } };
      const message = apiErr.response?.data?.message || 'Failed to create step increment request';
      toast.error(message);
    },
  });
};

export const useProcessStepIncrement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      incrementId: number;
      status: 'Approved' | 'Denied';
      remarks?: string;
    }) => {
      const response = await stepIncrementApi.process(data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: stepIncrementKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stepIncrementKeys.eligible() });
      // Also invalidate plantilla and employee queries since salary/step changed
      queryClient.invalidateQueries({ queryKey: ['plantilla'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      
      const action = variables.status === 'Approved' ? 'approved' : 'denied';
      toast.success(`Step increment ${action} successfully`);
    },
    onError: (error: unknown) => {
      const apiErr = error as { response?: { data?: { message?: string } } };
      const message = apiErr.response?.data?.message || 'Failed to process step increment';
      toast.error(message);
    },
  });
};
