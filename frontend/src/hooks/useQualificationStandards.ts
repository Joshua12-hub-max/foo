import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qualificationStandardsApi, type QualificationStandard } from '@/api/complianceApi';
import { toast } from 'react-hot-toast';

// ==================== QUERY KEYS ====================

export const qualificationStandardsKeys = {
  all: ['qualification-standards'] as const,
  lists: () => [...qualificationStandardsKeys.all, 'list'] as const,
  list: (filters: any) => [...qualificationStandardsKeys.lists(), filters] as const,
  details: () => [...qualificationStandardsKeys.all, 'detail'] as const,
  detail: (id: number) => [...qualificationStandardsKeys.details(), id] as const,
};

// ==================== QUERIES ====================

export const useQualificationStandards = (params?: { position_title?: string; salary_grade?: number; is_active?: boolean }) => {
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
    mutationFn: async ({ employee_id, position_id }: { employee_id: number; position_id: number }) => {
      const response = await qualificationStandardsApi.validate(employee_id, position_id);
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create qualification standard');
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update qualification standard');
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
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete qualification standard');
    },
  });
};
