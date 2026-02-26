import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// @ts-ignore
import { fetchEmployees, addEmployee, deleteEmployee } from '@api/employeeApi';
// @ts-ignore
import { fetchDepartments } from '@api/departmentApi';
import { Employee, Department } from '@/types';

export interface UseEmployeesReturn {
  employees: Employee[];
  departments: Department[];
  loading: boolean;
  isProcessing: boolean;
  loadEmployees: () => Promise<void>;
  handleAddEmployee: (formData: import('@/schemas/employeeSchema').UpdateEmployeeInput | FormData) => Promise<boolean>;
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
      const data = await fetchEmployees();
      if (data.success) {
        return data.employees || [];
      }
      throw new Error(data.message || 'Failed to fetch employees');
    },
    // Keep data fresh but allow background updates
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Fetch Departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const data = await fetchDepartments();
      if (data.success) {
        return data.departments || [];
      }
      return [];
    },
    staleTime: 1000 * 60 * 60 // 1 hour (departments change rarely)
  });

  // Add Employee Mutation
  const addMutation = useMutation({
    mutationFn: addEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onSuccess?.('Employee added successfully');
    },
    onError: (error: any) => {
      onError?.(error.message || 'Failed to add employee');
    }
  });

  // Delete Employee Mutation
  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onSuccess?.('Employee deleted successfully');
    },
    onError: (error: any) => {
      onError?.(error.message || 'Failed to delete employee');
    }
  });

  // Compatibility wrappers
  const handleAddEmployee = useCallback(async (formData: import('@/schemas/employeeSchema').UpdateEmployeeInput | FormData): Promise<boolean> => {
    try {
      const res = await addMutation.mutateAsync(formData);
      return res.success;
    } catch (error) {
      return false;
    }
  }, [addMutation]);

  const handleDeleteEmployee = useCallback(async (id: number): Promise<boolean> => {
    try {
      const res = await deleteMutation.mutateAsync(id);
      return res.success;
    } catch (error) {
      return false;
    }
  }, [deleteMutation]);

  const loadEmployees = useCallback(async () => {
    await refetchEmployees();
  }, [refetchEmployees]);

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
