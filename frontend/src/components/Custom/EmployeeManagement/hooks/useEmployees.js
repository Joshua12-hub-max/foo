import { useState, useEffect, useCallback } from 'react';
import { fetchEmployees, addEmployee, deleteEmployee, updateEmployee } from '../../../../api/employeeApi';
import { fetchDepartments } from '../../../../api/departmentApi';

/**
 * Custom hook for managing employee data and CRUD operations
 * @param {Function} onSuccess - Callback for successful operations
 * @param {Function} onError - Callback for failed operations
 * @returns {Object} Employee state and CRUD functions
 */
export const useEmployees = (onSuccess, onError) => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Load all employees from the API
   */
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchEmployees();
      if (data.success) {
        setEmployees(data.employees);
      }
    } catch (error) {
      onError?.('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  /**
   * Load all departments from the API
   */
  const loadDepartments = useCallback(async () => {
    try {
      const data = await fetchDepartments();
      if (data.success) {
        setDepartments(data.departments);
      }
    } catch (error) {
      // Silently fail for departments
    }
  }, []);

  /**
   * Add a new employee
   * @param {Object} formData - Employee data to add
   * @returns {boolean} Success status
   */
  const handleAddEmployee = useCallback(async (formData) => {
    setIsProcessing(true);
    try {
      const res = await addEmployee(formData);
      if (res.success) {
        await loadEmployees();
        onSuccess?.('Employee added successfully');
        return true;
      } else {
        onError?.(res.message || 'Failed to add employee');
        return false;
      }
    } catch (error) {
      onError?.('An error occurred while adding employee');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [loadEmployees, onSuccess, onError]);

  /**
   * Update an existing employee
   * @param {number} id - Employee ID to update
   * @param {Object} formData - Updated employee data
   * @returns {boolean} Success status
   */
  const handleUpdateEmployee = useCallback(async (id, formData) => {
    setIsProcessing(true);
    try {
      const res = await updateEmployee(id, formData);
      if (res.success) {
        await loadEmployees();
        onSuccess?.('Employee updated successfully');
        return true;
      } else {
        onError?.(res.message || 'Failed to update employee');
        return false;
      }
    } catch (error) {
      onError?.('An error occurred while updating employee');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [loadEmployees, onSuccess, onError]);

  /**
   * Delete an employee
   * @param {number} id - Employee ID to delete
   * @returns {boolean} Success status
   */
  const handleDeleteEmployee = useCallback(async (id) => {
    setIsProcessing(true);
    try {
      const res = await deleteEmployee(id);
      if (res.success) {
        await loadEmployees();
        onSuccess?.('Employee deleted successfully');
        return true;
      } else {
        onError?.(res.message || 'Failed to delete employee');
        return false;
      }
    } catch (error) {
      onError?.('An error occurred while deleting employee');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [loadEmployees, onSuccess, onError]);

  // Load data on mount
  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, [loadEmployees, loadDepartments]);

  return {
    employees,
    departments,
    loading,
    isProcessing,
    loadEmployees,
    handleAddEmployee,
    handleUpdateEmployee,
    handleDeleteEmployee
  };
};

export default useEmployees;
