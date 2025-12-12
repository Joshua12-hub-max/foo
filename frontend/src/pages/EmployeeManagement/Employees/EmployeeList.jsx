import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeHeader, EmployeeFilters, EmployeeGrid, ToastNotification, AddEmployeeModal, EditEmployeeModal, DeleteEmployeeModal, useEmployees, useEmployeeForm, useNotification, DEFAULT_ADD_FORM } from '../../../components/Custom/EmployeeManagement';

const EmployeeList = () => {
  const navigate = useNavigate();
  
  // Notification hook
  const { notification, showNotification } = useNotification();
  
  // Employee data hook
  const {employees,departments,loading,isProcessing,handleAddEmployee,handleUpdateEmployee,handleDeleteEmployee
  } = useEmployees(
    (msg) => showNotification(msg, 'success'),
    (msg) => showNotification(msg, 'error')
  );
  
  // Form hooks
  const { formData: addFormData, updateField: updateAddField, resetForm: resetAddForm } = useEmployeeForm('add');
  const { formData: editFormData, updateField: updateEditField, setFromEmployee } = useEmployeeForm('edit');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');

  // Filter employees based on search and department
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
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
  const handleEmployeeClick = (employee) => {
    navigate(`/admin-dashboard/employees/${employee.id}/profile`);
  };

  const handleEditClick = (employee) => {
    setSelectedEmployee(employee);
    setFromEmployee(employee);
    setShowEditModal(true);
  };

  const handleDeleteClick = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const success = await handleAddEmployee(addFormData);
    if (success) {
      setShowAddModal(false);
      resetAddForm();
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    const success = await handleUpdateEmployee(selectedEmployee.id, editFormData);
    if (success) {
      setShowEditModal(false);
      setSelectedEmployee(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;
    const success = await handleDeleteEmployee(selectedEmployee.id);
    if (success) {
      setShowDeleteModal(false);
      setSelectedEmployee(null);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Notification */}
      <ToastNotification notification={notification} />

      {/* Header */}
      <EmployeeHeader onAddClick={() => setShowAddModal(true)} />

      {/* Filters */}
      <EmployeeFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterDepartment={filterDepartment}
        onFilterChange={setFilterDepartment}
        filterOptions={filterOptions}
      />

      {/* Grid */}
      <EmployeeGrid
        employees={filteredEmployees}
        loading={loading}
        onEmployeeClick={handleEmployeeClick}
        onEditEmployee={handleEditClick}
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

      <EditEmployeeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        employee={selectedEmployee}
        formData={editFormData}
        onFormChange={updateEditField}
        departments={departments}
        onSubmit={handleEditSubmit}
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
};

export default EmployeeList;