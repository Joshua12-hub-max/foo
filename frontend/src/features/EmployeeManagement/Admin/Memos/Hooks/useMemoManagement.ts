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
import { formatFullName } from '@/utils/nameUtils';

export interface Memo {
  id: number;
  employeeId: string | number;
  employeeName: string;
  authorName?: string;
  memoNumber: string;
  memoType: string;
  subject: string;
  content?: string;
  priority: string;
  status: string;
  effectiveDate?: string;
  acknowledgmentRequired?: boolean;
  acknowledgedAt?: string;
  createdAt: string;
  department?: string;
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
  page: number;
  totalPages: number;
  handleFilterChange: (key: string, value: string) => void;
  handleSearch: () => void;
  handleClearFilters: () => void;
  handlePageChange: (page: number) => void;
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

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  // Load data function - memoized with useCallback
  const loadData = useCallback(async (currentFilters: Partial<MemoFilters> = {}, currentPage: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const [memosRes, employeesRes] = await Promise.all([
        fetchMemos({ ...currentFilters, page: currentPage, limit: LIMIT }),
        fetchEmployees()
      ]);
      const employeesResult = employeesRes as { employees?: Array<{ id: number; firstName?: string; first_name?: string; lastName?: string; last_name?: string }> };
      const rawEmployees = employeesResult.employees || (Array.isArray(employeesRes) ? employeesRes : []);
      const mappedEmployees: Employee[] = rawEmployees.map((emp) => ({
        id: emp.id,
        firstName: emp.firstName || emp.first_name || '',
        lastName: emp.lastName || emp.last_name || ''
      }));
      setEmployees(mappedEmployees);

      // Memos now include department directly from backend join
      const memosResult = memosRes as { memos?: Memo[], pagination?: { totalPages: number } };
      const rawMemos = memosResult.memos || [];
      setMemos(rawMemos);
      
      if (memosResult.pagination?.totalPages) {
        setTotalPages(memosResult.pagination.totalPages);
      } else {
        setTotalPages(1);
      }
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
      employee_id: String(memo.employeeId),
      memo_type: memo.memoType,
      subject: memo.subject,
      content: memo.content ?? '',
      priority: memo.priority,
      effective_date: memo.effectiveDate ? memo.effectiveDate.split('T')[0] : '',
      acknowledgment_required: memo.acknowledgmentRequired ?? false,
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
      const payload: Record<string, string | boolean | number> = { ...formData };
      // Ensure employee_id is a number for the API
      if (payload.employee_id) payload.employee_id = Number(payload.employee_id);

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

  // Handle page change - memoized
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      loadData(filters, newPage);
    }
  }, [filters, totalPages, loadData]);

  // Memoized employee options for select dropdown
  const employeeOptions = useMemo<EmployeeOption[]>(() => {
    return employees.map(emp => ({
      value: emp.id,
      label: formatFullName(emp.lastName, emp.firstName)
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

    // Filters & Pagination
    filters,
    page,
    totalPages,
    handleFilterChange,
    handleSearch,
    handleClearFilters,
    handlePageChange,

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
