/**
 * useMemoManagement Hook
 * Custom hook for managing employee memos in Admin Portal
 * Optimized with useMemo and useCallback for performance
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchMemos, createMemo, updateMemo, deleteMemo } from '../../../../../api/memoApi';
import { fetchEmployees } from '../../../../../api/employeeApi';
import { INITIAL_FORM_DATA, INITIAL_FILTERS } from '../../Constants/memoConstants';

export const useMemoManagement = () => {
  // Data state
  const [memos, setMemos] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Filter state
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState(null);

  // Form data
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // Load data function - memoized with useCallback
  const loadData = useCallback(async (currentFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const [memosRes, employeesRes] = await Promise.all([
        fetchMemos(currentFilters),
        fetchEmployees()
      ]);
      setMemos(memosRes.memos || []);
      setEmployees(employeesRes.employees || employeesRes || []);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData({});
  }, [loadData]);

  // Apply filters - memoized
  const handleSearch = useCallback(() => {
    loadData(filters);
  }, [filters, loadData]);

  // Filter change handler - memoized
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear filters - memoized
  const handleClearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    loadData({});
  }, [loadData]);

  // Open create form - memoized
  const openCreateForm = useCallback(() => {
    setSelectedMemo(null);
    setFormData(INITIAL_FORM_DATA);
    setIsFormOpen(true);
  }, []);

  // Open edit form - memoized
  const openEditForm = useCallback((memo) => {
    setSelectedMemo(memo);
    setFormData({
      employee_id: memo.employee_id,
      memo_type: memo.memo_type,
      subject: memo.subject,
      content: memo.content,
      priority: memo.priority,
      effective_date: memo.effective_date ? memo.effective_date.split('T')[0] : '',
      acknowledgment_required: memo.acknowledgment_required,
      status: memo.status
    });
    setIsFormOpen(true);
  }, []);

  // Open view modal - memoized
  const openViewModal = useCallback((memo) => {
    setSelectedMemo(memo);
    setIsViewOpen(true);
  }, []);

  // Open delete modal - memoized
  const openDeleteModal = useCallback((memo) => {
    setSelectedMemo(memo);
    setIsDeleteOpen(true);
  }, []);

  // Close form modal - memoized
  const closeFormModal = useCallback(() => {
    setIsFormOpen(false);
    setSelectedMemo(null);
  }, []);

  // Close view modal - memoized
  const closeViewModal = useCallback(() => {
    setIsViewOpen(false);
    setSelectedMemo(null);
  }, []);

  // Close delete modal - memoized
  const closeDeleteModal = useCallback(() => {
    setIsDeleteOpen(false);
    setSelectedMemo(null);
  }, []);

  // Form data change handler - memoized
  const handleFormChange = useCallback((key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Submit form - memoized
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (selectedMemo) {
        await updateMemo(selectedMemo.id, formData);
      } else {
        await createMemo(formData);
      }
      setIsFormOpen(false);
      loadData(filters);
    } catch (err) {
      setError('Failed to save memo');
    } finally {
      setSaving(false);
    }
  }, [selectedMemo, formData, filters, loadData]);

  // Delete memo - memoized
  const handleDelete = useCallback(async () => {
    try {
      setSaving(true);
      await deleteMemo(selectedMemo.id);
      setIsDeleteOpen(false);
      loadData(filters);
    } catch (err) {
      setError('Failed to delete memo');
    } finally {
      setSaving(false);
    }
  }, [selectedMemo, filters, loadData]);

  // Memoized employee options for select dropdown
  const employeeOptions = useMemo(() => {
    return employees.map(emp => ({
      value: emp.id,
      label: `${emp.first_name} ${emp.last_name}`
    }));
  }, [employees]);

  return {
    // Data
    memos,
    employees,
    employeeOptions,
    loading,
    error,
    saving,

    // Filters
    filters,
    handleFilterChange,
    handleSearch,
    handleClearFilters,

    // Modal states
    isFormOpen,
    isViewOpen,
    isDeleteOpen,
    selectedMemo,

    // Form
    formData,
    handleFormChange,

    // Actions
    loadData,
    openCreateForm,
    openEditForm,
    openViewModal,
    openDeleteModal,
    closeFormModal,
    closeViewModal,
    closeDeleteModal,
    handleSubmit,
    handleDelete
  };
};

export default useMemoManagement;
