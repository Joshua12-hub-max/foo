import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualificationStandardsApi, type QualificationStandard } from '@/api/complianceApi';
import { toast } from 'react-hot-toast';

// ==================== QUERY KEYS ====================

export const qualificationStandardsKeys = {
  all: ['qualification-standards'] as const,
  lists: () => [...qualificationStandardsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...qualificationStandardsKeys.lists(), filters] as const,
  details: () => [...qualificationStandardsKeys.all, 'detail'] as const,
  detail: (id: number) => [...qualificationStandardsKeys.details(), id] as const,
};

// ==================== QUERIES ====================

export const useQualificationStandards = (params?: { positionTitle?: string; salaryGrade?: number; isActive?: boolean }) => {
  return useQuery({
    queryKey: qualificationStandardsKeys.list(params || {}),
    queryFn: async () => {
      const response = await qualificationStandardsApi.getAll(params);
      return response.data.standards;
    },
  });
};

export const useQualificationStandard = (id: number) => {
  return useQuery({
    queryKey: qualificationStandardsKeys.detail(id),
    queryFn: async () => {
      const response = await qualificationStandardsApi.getById(id);
      return response.data.standard;
    },
    enabled: !!id,
  });
};

export const useValidateQualifications = () => {
  return useMutation({
    mutationFn: async ({ employeeId, positionId }: { employeeId: number; positionId: number }) => {
      const response = await qualificationStandardsApi.validate(employeeId, positionId);
      return response.data;
    },
  });
};

// ==================== MUTATIONS ====================

export const useCreateQualificationStandard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<QualificationStandard, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await qualificationStandardsApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qualificationStandardsKeys.lists() });
      toast.success('Qualification standard created successfully');
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create qualification standard';
      toast.error(message);
    },
  });
};

export const useUpdateQualificationStandard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<QualificationStandard> }) => {
      const response = await qualificationStandardsApi.update(id, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: qualificationStandardsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: qualificationStandardsKeys.detail(variables.id) });
      toast.success('Qualification standard updated successfully');
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update qualification standard';
      toast.error(message);
    },
  });
};

export const useDeleteQualificationStandard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await qualificationStandardsApi.delete(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qualificationStandardsKeys.lists() });
      toast.success('Qualification standard deleted successfully');
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete qualification standard';
      toast.error(message);
    },
  });
};
