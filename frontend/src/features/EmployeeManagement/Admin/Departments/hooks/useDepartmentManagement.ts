import { useState, useEffect, useMemo, useCallback } from 'react';
// @ts-ignore
import { fetchDepartments, addDepartment, updateDepartment, deleteDepartment } from '@api/departmentApi';

import { DepartmentSchema } from '@/schemas/department';

export interface Department {
  id: number;
  name: string;
  description?: string;
  head_of_department?: string;
  employee_count?: number;
}
// DepartmentFormData removed in favor of DepartmentSchema

export interface DepartmentStats {
  total: number;
  totalEmployees: number;
  averageEmployees: number;
}

export interface UseDepartmentManagementReturn {
  departments: Department[];
  filteredDepartments: Department[];
  loading: boolean;
  error: string | null;
  stats: DepartmentStats;
  searchTerm: string;
  isModalOpen: boolean;
  editingDepartment: Department | null;
  deleteModalOpen: boolean;
  departmentToDelete: Department | null;
  isDeleting: boolean;
  handleSearchChange: (term: string) => void;
  handleAdd: () => void;
  handleEdit: (dept: Department) => void;
  handleDeleteClick: (dept: Department) => void;
  handleDeleteCancel: () => void;
  handleDeleteConfirm: () => Promise<void>;
  handleModalSubmit: (data: DepartmentSchema) => Promise<{ success: boolean; error?: string }>;
  handleModalClose: () => void;
  refresh: () => Promise<void>;
}


export const useDepartmentManagement = (): UseDepartmentManagementReturn => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  
  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDepartments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDepartments();
      if (data.success) {
        setDepartments(data.departments);
      } else {
        setError('Failed to fetch departments');
      }
    } catch (err: any) {
      console.error("Failed to load departments", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingDepartment(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((dept: Department) => {
    setEditingDepartment(dept);
    setIsModalOpen(true);
  }, []);

  // Open delete confirmation modal
  const handleDeleteClick = useCallback((dept: Department) => {
    setDepartmentToDelete(dept);
    setDeleteModalOpen(true);
  }, []);

  // Close delete modal
  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpen(false);
    setDepartmentToDelete(null);
  }, []);

  // Confirm delete
  const handleDeleteConfirm = useCallback(async () => {
    if (!departmentToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteDepartment(departmentToDelete.id);
      setDepartments(prev => prev.filter(d => d.id !== departmentToDelete.id));
      setDeleteModalOpen(false);
      setDepartmentToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete department", err);
      setError(err.message || "Failed to delete department");
    } finally {
      setIsDeleting(false);
    }
  }, [departmentToDelete]);

  const handleModalSubmit = useCallback(async (data: DepartmentSchema): Promise<{ success: boolean; error?: string }> => {
    try {
      if (editingDepartment) {
        const response = await updateDepartment(editingDepartment.id, data);
        if (response.success) {
          loadDepartments();
        }
      } else {
        const response = await addDepartment(data);
        if (response.success) {
          loadDepartments();
        }
      }
      setIsModalOpen(false);
      return { success: true };
    } catch (err: any) {
      console.error("Failed to save department", err);
      return { success: false, error: err.message };
    }
  }, [editingDepartment, loadDepartments]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingDepartment(null);
  }, []);

  // Derived Data
  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => 
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.head_of_department && dept.head_of_department.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [departments, searchTerm]);

  const stats = useMemo((): DepartmentStats => {
    const total = departments.length;
    const totalEmp = departments.reduce((acc, curr) => acc + (curr.employee_count || 0), 0);
    const avg = total > 0 ? Math.round(totalEmp / total) : 0;
    return { total, totalEmployees: totalEmp, averageEmployees: avg };
  }, [departments]);

  return {
    departments,
    filteredDepartments,
    loading,
    error,
    stats,
    searchTerm,
    isModalOpen,
    editingDepartment,
    // Delete modal state
    deleteModalOpen,
    departmentToDelete,
    isDeleting,
    // Actions
    handleSearchChange,
    handleAdd,
    handleEdit,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    handleModalSubmit,
    handleModalClose,
    refresh: loadDepartments
  };
};
