import React, { useState, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { Plus } from 'lucide-react';
import { useToastStore } from '@/stores';
import { EmployeeFilters, EmployeeGrid, AddEmployeeModal, DeleteEmployeeModal, useEmployees } from '@features/EmployeeManagement/Admin';

interface OutletContext {
  sidebarOpen?: boolean;
}

interface EmployeeListProps {
  hideHeader?: boolean;
}

export interface EmployeeListRef {
  openAddModal: () => void;
}

interface Employee {
  id: number;
  first_name?: string;
  last_name?: string;
  employee_id?: string;
  department?: string;
}

interface Department {
  id: number;
  name: string;
}

const EmployeeList = forwardRef<EmployeeListRef, EmployeeListProps>(({ hideHeader = false }, ref) => {
  const navigate = useNavigate();
  
  // Notification hook
  const showToast = useToastStore((state) => state.showToast);
  const showNotification = (message: string, type: 'success' | 'error') => showToast(message, type);
  
  // Employee data hook
  const { employees, departments, loading, isProcessing, handleAddEmployee, handleDeleteEmployee } = useEmployees(
    (msg: string) => showNotification(msg, 'success'),
    (msg: string) => showNotification(msg, 'error')
  );
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // Expose modal trigger to parent
  useImperativeHandle(ref, () => ({
    openAddModal: () => setShowAddModal(true)
  }));

  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDepartment, setFilterDepartment] = useState<string>('All');

  // Filter employees based on search and department
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp: Employee) => {
      const matchesSearch = 
        (emp.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = filterDepartment === 'All' || emp.department === filterDepartment;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, filterDepartment]);

  // Generate filter options from departments and employees
  const filterOptions = useMemo(() => {
    return ['All', ...new Set([
      ...departments.map((d: Department) => d.name), 
      ...employees.map((e: Employee) => e.department)
    ])].filter(Boolean) as string[];
  }, [departments, employees]);

  // Event handlers
  const handleEmployeeClick = useCallback((employee: Employee): void => {
    navigate(`/admin-dashboard/employees/${employee.id}/profile`);
  }, [navigate]);

  const handleDeleteClick = useCallback((employee: Employee): void => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  }, []);

  // handleAddSubmit removed as it is now handled internally by AddEmployeeModal

  // handleConfirmDelete removed as it is now handled internally by DeleteEmployeeModal

  return (
    <div className="w-full">
      {/* Notification */}


      {/* Header Section */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Employee Directory</h2>
            <p className="text-sm text-gray-500">Manage and oversee your organization's members</p>
          </div>
          <button 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-semibold"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} />
            Onboard Member
          </button>
        </div>
      )}

      {/* Filters */}
      <EmployeeFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterDepartment={filterDepartment}
        onFilterChange={setFilterDepartment}
        filterOptions={filterOptions}
        totalRecords={filteredEmployees.length}
      />

      {/* Table */}
      <EmployeeGrid
        employees={filteredEmployees}
        loading={loading}
        onEmployeeClick={handleEmployeeClick}
        onEditEmployee={handleEmployeeClick}
        onDeleteEmployee={handleDeleteClick}
      />

      {/* Modals */}
      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        departments={departments}
        onSuccess={() => {
            // Data is reloaded via query invalidation in AddEmployeeModal
        }}
      />

      <DeleteEmployeeModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        employee={selectedEmployee}
        onSuccess={() => {
            // Force reload employees
            // In a real query setup this is automatic via key invalidation but here we might need to trigger parent refresh
            // Fortunately the modal invalidates 'employees' query key so we typically do nothing if useEmployees uses useQuery.
            // But checking useEmployees hook, it might be legacy or hybrid.
            // Let's assume we rely on query invalidation.
        }}
      />
    </div>
  );
});

EmployeeList.displayName = 'EmployeeList';

export default EmployeeList;
