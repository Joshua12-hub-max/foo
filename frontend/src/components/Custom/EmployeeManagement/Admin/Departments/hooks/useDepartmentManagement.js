import { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchDepartments, addDepartment, updateDepartment, deleteDepartment } from '@api/departmentApi';

export const useDepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  
  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
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
    } catch (err) {
      console.error("Failed to load departments", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingDepartment(null);
    setIsModalOpen(true);
  }, []);

  const handleEdit = useCallback((dept) => {
    setEditingDepartment(dept);
    setIsModalOpen(true);
  }, []);

  // Open delete confirmation modal
  const handleDeleteClick = useCallback((dept) => {
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
    } catch (err) {
      console.error("Failed to delete department", err);
      setError(err.message || "Failed to delete department");
    } finally {
      setIsDeleting(false);
    }
  }, [departmentToDelete]);

  const handleModalSubmit = useCallback(async (formData) => {
    try {
      if (editingDepartment) {
        const response = await updateDepartment(editingDepartment.id, formData);
        if (response.success) {
          loadDepartments();
        }
      } else {
        const response = await addDepartment(formData);
        if (response.success) {
          loadDepartments();
        }
      }
      setIsModalOpen(false);
      return { success: true };
    } catch (err) {
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

  const stats = useMemo(() => {
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
