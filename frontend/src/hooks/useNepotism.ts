import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nepotismApi, type NepotismRelationship } from '@/api/complianceApi';
import { toast } from 'react-hot-toast';

export const nepotismKeys = {
  all: ['nepotism'] as const,
  relationships: () => [...nepotismKeys.all, 'relationships'] as const,
  relationship: (filters: Record<string, unknown>) => [...nepotismKeys.relationships(), filters] as const,
  employeeRelationships: (id: number) => [...nepotismKeys.all, 'employee', id] as const,
};

export const useNepotismRelationships = (params?: { employee_id?: number; degree?: number }) => {
  return useQuery({
    queryKey: nepotismKeys.relationship(params || {}),
    queryFn: async () => {
      const response = await nepotismApi.getRelationships(params);
      return response.data.relationships;
    },
  });
};

export const useEmployeeRelationships = (employee_id: number) => {
  return useQuery({
    queryKey: nepotismKeys.employeeRelationships(employee_id),
    queryFn: async () => {
      const response = await nepotismApi.getEmployeeRelationships(employee_id);
      return response.data.relationships;
    },
    enabled: !!employee_id,
  });
};

export const useCheckNepotism = () => {
  return useMutation({
    mutationFn: async (data: { employee_id: number; position_id: number; appointing_authority_id?: number }) => {
      const response = await nepotismApi.checkNepotism(data);
      return response.data;
    },
  });
};

export const useCreateNepotismRelationship = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      employee_id_1: number;
      employee_id_2: number;
      relationship_type: string;
      degree: number;
      notes?: string;
    }) => {
      const response = await nepotismApi.createRelationship(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nepotismKeys.relationships() });
      toast.success('Relationship registered successfully');
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to register relationship';
      toast.error(message);
    },
  });
};

export const useDeleteNepotismRelationship = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await nepotismApi.deleteRelationship(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: nepotismKeys.relationships() });
      toast.success('Relationship deleted successfully');
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to delete relationship';
      toast.error(message);
    },
  });
};
