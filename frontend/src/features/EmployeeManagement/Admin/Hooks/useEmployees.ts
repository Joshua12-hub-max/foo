import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '@/api/employeeApi';
import { departmentApi } from '@/api/departmentApi';

import { Employee } from '@/types';
import { UpdateEmployeeInput } from '@/schemas/employeeSchema';

export interface Department {
  id: number;
  name: string;
}

export interface UseEmployeesReturn {
  employees: Employee[];
  departments: Department[];
  loading: boolean;
  isProcessing: boolean;
  loadEmployees: (deptParams?: { department?: string, departmentId?: number }) => Promise<void>;
  handleAddEmployee: (formData: UpdateEmployeeInput) => Promise<boolean>;
  handleDeleteEmployee: (id: number) => Promise<boolean>;
}

/**
 * Custom hook for managing employee data and CRUD operations
 * @param onSuccess - Callback for successful operations
 * @param onError - Callback for failed operations
 * @returns Employee state and CRUD functions
 */
export const useEmployees = (
  onSuccess?: (message: string) => void, 
  onError?: (message: string) => void
): UseEmployeesReturn => {
  const queryClient = useQueryClient();

  // Fetch Employees
  const { data: employees = [], isLoading: loadingEmployees, refetch: refetchEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const data = await employeeApi.fetchEmployees();
      if (data.success) {
        return data.employees || [];
      }
      throw new Error(data.message || 'Failed to fetch employees');
    },
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Fetch Departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments-public'],
    queryFn: async () => {
      const data = await departmentApi.fetchPublicDepartments();
      if (data.success) {
        return (data.departments as Department[]) || [];
      }
      return [];
    },
    staleTime: 1000 * 60 * 30 // 30 minutes
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: (formData: UpdateEmployeeInput) => employeeApi.addEmployee(formData),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        onSuccess?.(data.message || 'Employee added successfully');
      } else {
        onError?.(data.message || 'Failed to add employee');
      }
    },
    onError: (error: any) => {
        onError?.(error.message || 'An unexpected error occurred');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => employeeApi.deleteEmployee(id),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['employees'] });
        onSuccess?.(data.message || 'Employee deleted successfully');
      } else {
        onError?.(data.message || 'Failed to delete employee');
      }
    },
    onError: (error: any) => {
        onError?.(error.message || 'An unexpected error occurred');
    }
  });

  const loadEmployees = useCallback(async (deptParams?: { department?: string, departmentId?: number }) => {
    // Note: In TanStack Query, we'd usually add params to queryKey.
    // However, if the legacy code expects a manual trigger, we can use refetch.
    // For now we'll just refetch to stay consistent with existing patterns
    await refetchEmployees();
  }, [refetchEmployees]);

  const handleAddEmployee = async (formData: UpdateEmployeeInput): Promise<boolean> => {
    const result = await addMutation.mutateAsync(formData);
    return !!result.success;
  };

  const handleDeleteEmployee = async (id: number): Promise<boolean> => {
    const result = await deleteMutation.mutateAsync(id);
    return !!result.success;
  };

  return {
    employees,
    departments,
    loading: loadingEmployees,
    isProcessing: addMutation.isPending || deleteMutation.isPending,
    loadEmployees,
    handleAddEmployee,
    handleDeleteEmployee
  };
};

export default useEmployees;
