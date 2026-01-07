import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchEmployees, addEmployee, deleteEmployee } from '@api/employeeApi';
import { fetchDepartments } from '@api/departmentApi';

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

  // Use refs to keep callbacks stable and avoid re-renders or infinite loops
  const successRef = useRef(onSuccess);
  const errorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    successRef.current = onSuccess;
    errorRef.current = onError;
  }, [onSuccess, onError]);

  /**
   * Load all employees from the API
   */
  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchEmployees();
      if (data.success) {
        setEmployees(data.employees || []);
      } else {
        errorRef.current?.('Failed to fetch employees');
      }
    } catch (error) {
      errorRef.current?.('Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies, completely stable

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
        successRef.current?.('Employee added successfully');
        return true;
      } else {
        errorRef.current?.(res.message || 'Failed to add employee');
        return false;
      }
    } catch (error) {
      errorRef.current?.('An error occurred while adding employee');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [loadEmployees]);

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
        successRef.current?.('Employee deleted successfully');
        return true;
      } else {
        errorRef.current?.(res.message || 'Failed to delete employee');
        return false;
      }
    } catch (error) {
      errorRef.current?.('An error occurred while deleting employee');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [loadEmployees]);

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
    handleDeleteEmployee
  };
};

export default useEmployees;

