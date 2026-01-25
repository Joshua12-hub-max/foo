import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stepIncrementApi, type StepIncrement } from '@/api/complianceApi';
import { toast } from 'react-hot-toast';

// ==================== QUERY KEYS ====================

export const stepIncrementKeys = {
  all: ['step-increments'] as const,
  lists: () => [...stepIncrementKeys.all, 'list'] as const,
  list: (filters: any) => [...stepIncrementKeys.lists(), filters] as const,
  eligible: () => [...stepIncrementKeys.all, 'eligible'] as const,
};

// ==================== QUERIES ====================

export const useStepIncrements = (params?: { status?: string; employee_id?: number }) => {
  return useQuery({
    queryKey: stepIncrementKeys.list(params || {}),
    queryFn: async () => {
      const response = await stepIncrementApi.getAll(params);
      return response.data.increments;
    },
  });
};

export const useEligibleEmployees = () => {
  return useQuery({
    queryKey: stepIncrementKeys.eligible(),
    queryFn: async () => {
      const response = await stepIncrementApi.getEligible();
      return response.data;
    },
  });
};

// ==================== MUTATIONS ====================

export const useCreateStepIncrement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      employee_id: number;
      position_id: number;
      current_step: number;
      eligible_date: string;
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create step increment request');
    },
  });
};

export const useProcessStepIncrement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      increment_id: number;
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process step increment');
    },
  });
};
