/**
 * useDepartmentDetail Hook
 * Custom hook for managing department detail view
 * Optimized with useMemo and useCallback for performance
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDepartmentById, fetchDepartmentEmployees, removeEmployeeFromDepartment } from '@api/departmentApi';

export const useDepartmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Data state
  const [department, setDepartment] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load data - memoized with useCallback
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [deptData, empData] = await Promise.all([
        fetchDepartmentById(id),
        fetchDepartmentEmployees(id)
      ]);
      
      if (deptData.success) setDepartment(deptData.department);
      if (empData.success) setEmployees(empData.employees || []);
    } catch (err) {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, loadData]);

  // Navigate back - memoized
  const navigateBack = useCallback(() => {
    navigate('/admin-dashboard/departments');
  }, [navigate]);

  // Navigate to employee profile - memoized
  const navigateToEmployee = useCallback((employeeId) => {
    navigate(`/admin-dashboard/employees/${employeeId}/profile`);
  }, [navigate]);

  // Handle remove employee - memoized
  const handleRemoveEmployee = useCallback(async (employeeId) => {
    try {
      setIsProcessing(true);
      const result = await removeEmployeeFromDepartment(id, employeeId);
      if (result.success) {
        await loadData();
      }
    } catch (error) {
      // Handle error
    } finally {
      setIsProcessing(false);
      setDeleteConfirm(null);
    }
  }, [id, loadData]);

  // Search change handler - memoized
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  // Open add employee modal - memoized
  const openAddEmployeeModal = useCallback(() => {
    setIsAddEmployeeModalOpen(true);
  }, []);

  // Close add employee modal - memoized
  const closeAddEmployeeModal = useCallback(() => {
    setIsAddEmployeeModalOpen(false);
  }, []);

  // Open delete confirm - memoized
  const openDeleteConfirm = useCallback((employee) => {
    setDeleteConfirm(employee);
  }, []);

  // Close delete confirm - memoized
  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  // Filtered employees - memoized with useMemo
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.job_title && emp.job_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.position_title && emp.position_title.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [employees, searchTerm]);

  return {
    // Params
    id,
    
    // Data
    department,
    employees,
    filteredEmployees,
    loading,
    searchTerm,
    
    // Modal states
    isAddEmployeeModalOpen,
    deleteConfirm,
    isProcessing,
    
    // Actions
    loadData,
    navigateBack,
    navigateToEmployee,
    handleRemoveEmployee,
    handleSearchChange,
    openAddEmployeeModal,
    closeAddEmployeeModal,
    openDeleteConfirm,
    closeDeleteConfirm
  };
};

export default useDepartmentDetail;
