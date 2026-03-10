/**
 * useMemoManagement Hook
 * Custom hook for managing employee memos in Admin Portal
 * Optimized with useMemo and useCallback for performance
 */

import { useState, useEffect, useCallback, useMemo, FormEvent } from 'react';
// @ts-ignore
import { fetchMemos, createMemo, updateMemo, deleteMemo } from '@api/memoApi';
// @ts-ignore
import { fetchEmployees } from '@api/employeeApi';
import { INITIAL_FORM_DATA, INITIAL_FILTERS, MemoFormData, MemoFilters } from '../Constants/memoConstants';

export interface Memo {
  id: number;
  employeeId: string | number;
  employeeName: string;
  authorName?: string;
  memoNumber: string;
  memoType: string;
  subject: string;
  content: string;
  priority: string;
  status: string;
  effectiveDate?: string;
  acknowledgmentRequired: boolean;
  acknowledgedAt?: string;
  createdAt: string;
}

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

export interface EmployeeOption {
  value: number;
  label: string;
}

export interface UseMemoManagementReturn {
  memos: Memo[];
  employees: Employee[];
  employeeOptions: EmployeeOption[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  filters: MemoFilters;
  handleFilterChange: (key: string, value: string) => void;
  handleSearch: () => void;
  handleClearFilters: () => void;
  isFormOpen: boolean;
  isViewOpen: boolean;
  isDeleteOpen: boolean;
  selectedMemo: Memo | null;
  formData: MemoFormData;
  handleFormChange: (key: string, value: string | boolean) => void;
  loadData: (currentFilters?: Partial<MemoFilters>) => Promise<void>;
  openCreateForm: () => void;
  openEditForm: (memo: Memo) => void;
  openViewModal: (memo: Memo) => void;
  openDeleteModal: (memo: Memo) => void;
  closeFormModal: () => void;
  closeViewModal: () => void;
  closeDeleteModal: () => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  handleDelete: () => Promise<void>;
}

export const useMemoManagement = (): UseMemoManagementReturn => {
  // Data state
  const [memos, setMemos] = useState<Memo[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<MemoFilters>(INITIAL_FILTERS);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);

  // Form data
  const [formData, setFormData] = useState<MemoFormData>(INITIAL_FORM_DATA);

  // Load data function - memoized with useCallback
  const loadData = useCallback(async (currentFilters: Partial<MemoFilters> = {}) => {
    try {
      setLoading(true);
      setError(null);
      const [memosRes, employeesRes] = await Promise.all([
        fetchMemos(currentFilters),
        fetchEmployees()
      ]);
      const memosData = memosRes.data as unknown as { memos: Memo[] };
      const memosList = memosData?.memos || (memosRes as {memos?: Memo[]}).memos || [];
      setMemos(memosList);
      
      const empData = employeesRes as { employees?: Employee[] };
      setEmployees((empData.employees || employeesRes || []) as Employee[]);
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
  const handleFilterChange = useCallback((key: string, value: string) => {
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
  const openEditForm = useCallback((memo: Memo) => {
    setSelectedMemo(memo);
    setFormData({
      employeeId: String(memo.employeeId),
      memoType: memo.memoType,
      subject: memo.subject,
      content: memo.content,
      priority: memo.priority,
      effectiveDate: memo.effectiveDate ? memo.effectiveDate.split('T')[0] : '',
      acknowledgmentRequired: memo.acknowledgmentRequired,
      status: memo.status
    });
    setIsFormOpen(true);
  }, []);

  // Open view modal - memoized
  const openViewModal = useCallback((memo: Memo) => {
    setSelectedMemo(memo);
    setIsViewOpen(true);
  }, []);

  // Open delete modal - memoized
  const openDeleteModal = useCallback((memo: Memo) => {
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
  const handleFormChange = useCallback((key: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Submit form - memoized
  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        memoType: formData.memoType,
        subject: formData.subject,
        content: formData.content,
        priority: formData.priority,
        effectiveDate: formData.effectiveDate,
        acknowledgmentRequired: formData.acknowledgmentRequired,
        status: formData.status,
        employeeId: Number(formData.employeeId)
      };

      if (selectedMemo) {
        await updateMemo(selectedMemo.id, payload);
      } else {
        await createMemo(payload);
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
      await deleteMemo(selectedMemo!.id);
      setIsDeleteOpen(false);
      loadData(filters);
    } catch (err) {
      setError('Failed to delete memo');
    } finally {
      setSaving(false);
    }
  }, [selectedMemo, filters, loadData]);

  // Memoized employee options for select dropdown
  const employeeOptions = useMemo<EmployeeOption[]>(() => {
    return employees.map(emp => ({
      value: emp.id,
      label: `${emp.firstName} ${emp.lastName}`
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
