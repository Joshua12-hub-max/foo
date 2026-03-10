/**
 * useDepartmentDetail Hook
 * Custom hook for managing department detail view
 * Optimized with useMemo and useCallback for performance
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// @ts-ignore
import { fetchDepartmentById, fetchDepartmentEmployees, removeEmployeeFromDepartment } from '@api/departmentApi';

export interface Department {
  id: number;
  name: string;
  description?: string | null;
  headOfDepartment?: string | null;
  employeeCount?: number | null;
}

export interface Employee {
  id: number;
  firstName?: string;
  lastName?: string;
  jobTitle?: string | null;
  positionTitle?: string | null;
  department?: string | null;
  email?: string;
  avatarUrl?: string | null;
}

export interface UseDepartmentDetailReturn {
  id: string | undefined;
  department: Department | null;
  employees: Employee[];
  filteredEmployees: Employee[];
  loading: boolean;
  searchTerm: string;
  isAddEmployeeModalOpen: boolean;
  deleteConfirm: Employee | null;
  isProcessing: boolean;
  loadData: () => Promise<void>;
  navigateBack: () => void;
  navigateToEmployee: (employeeId: number) => void;
  handleRemoveEmployee: (employeeId: number) => Promise<void>;
  handleSearchChange: (value: string) => void;
  openAddEmployeeModal: () => void;
  closeAddEmployeeModal: () => void;
  openDeleteConfirm: (employee: Employee) => void;
  closeDeleteConfirm: () => void;
}

export const useDepartmentDetail = (): UseDepartmentDetailReturn => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Data state
  const [department, setDepartment] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Employee | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load data - memoized with useCallback
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      if (!id) return;
      const [deptData, empData] = await Promise.all([
        fetchDepartmentById(id),
        fetchDepartmentEmployees(id)
      ]);
      
      if (deptData.success) setDepartment(deptData.department || null);
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
  const navigateToEmployee = useCallback((employeeId: number) => {
    navigate(`/admin-dashboard/employees/${employeeId}/profile`);
  }, [navigate]);

  // Handle remove employee - memoized
  const handleRemoveEmployee = useCallback(async (employeeId: number) => {
    try {
      setIsProcessing(true);
      if (!id) return;
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
  const handleSearchChange = useCallback((value: string) => {
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
  const openDeleteConfirm = useCallback((employee: Employee) => {
    setDeleteConfirm(employee);
  }, []);

  // Close delete confirm - memoized
  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  // Filtered employees - memoized with useMemo
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.jobTitle && emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (emp.positionTitle && emp.positionTitle.toLowerCase().includes(searchTerm.toLowerCase()))
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
