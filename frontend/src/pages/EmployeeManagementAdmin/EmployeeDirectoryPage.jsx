import { useState, useMemo, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { 
  EmployeeFilters, 
  EmployeeGrid, 
  ToastNotification, 
  AddEmployeeModal, 
  DeleteEmployeeModal, 
  useEmployees, 
  useEmployeeForm, 
  useNotification 
} from '@components/Custom/EmployeeManagement/Admin';

const EmployeeList = forwardRef(({ hideHeader = false }, ref) => {
  const navigate = useNavigate();
  
  // Notification hook
  const { notification, showNotification } = useNotification();
  
  // Employee data hook
  const { employees, departments, loading, isProcessing, handleAddEmployee, handleDeleteEmployee } = useEmployees(
    (msg) => showNotification(msg, 'success'),
    (msg) => showNotification(msg, 'error')
  );
  
  // Form hooks
  const { formData: addFormData, updateField: updateAddField, resetForm: resetAddForm } = useEmployeeForm('add');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Expose modal trigger to parent
  useImperativeHandle(ref, () => ({
    openAddModal: () => setShowAddModal(true)
  }));

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');

  // Filter employees based on search and department
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
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
      ...departments.map(d => d.name), 
      ...employees.map(e => e.department)
    ])].filter(Boolean);
  }, [departments, employees]);

  // Event handlers
  const handleEmployeeClick = useCallback((employee) => {
    navigate(`/admin-dashboard/employees/${employee.id}/profile`);
  }, [navigate]);

  const handleDeleteClick = useCallback((employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  }, []);

  const handleAddSubmit = useCallback(async (e) => {
    e.preventDefault();
    const success = await handleAddEmployee(addFormData);
    if (success) {
      setShowAddModal(false);
      resetAddForm();
    }
  }, [addFormData, handleAddEmployee, resetAddForm]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedEmployee) return;
    const success = await handleDeleteEmployee(selectedEmployee.id);
    if (success) {
      setShowDeleteModal(false);
      setSelectedEmployee(null);
    }
  }, [selectedEmployee, handleDeleteEmployee]);

  return (
    <div className="w-full">
      {/* Notification */}
      <ToastNotification notification={notification} />

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
        formData={addFormData}
        onFormChange={updateAddField}
        departments={departments}
        onSubmit={handleAddSubmit}
        isProcessing={isProcessing}
      />

      <DeleteEmployeeModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        employee={selectedEmployee}
        onConfirm={handleConfirmDelete}
        isProcessing={isProcessing}
      />
    </div>
  );
});

export default EmployeeList;