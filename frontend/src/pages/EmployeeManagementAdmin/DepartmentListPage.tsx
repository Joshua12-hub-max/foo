import React, { forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { RefreshCw, Plus } from 'lucide-react';
import { useDepartments, DepartmentSearch, DepartmentTable, DepartmentFormModal, DepartmentDeleteModal, RemoveEmployeeModal } from '@features/EmployeeManagement/Admin/Departments';
import { useState } from 'react';
import RegistrationTypeModal from '@/components/Custom/EmployeeManagement/Admin/Modals/RegistrationTypeModal';
import { Department } from '@/types/org';

import { Employee } from '@/types';

interface OutletContext {
  sidebarOpen?: boolean;
}

interface DepartmentListProps {
  hideHeader?: boolean;
}

export interface DepartmentListRef {
  openAddModal: () => void;
}

const DepartmentList = forwardRef<DepartmentListRef, DepartmentListProps>(({ hideHeader = false }, ref) => {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);

  const { 
    filteredDepartments, 
    loading,
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
    refresh 
  } = useDepartments();
  
  // Remove Employee Modal State
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] = useState<Employee | null>(null);
  const [removeDeptId, setRemoveDeptId] = useState<number | null>(null);

  const handleRemoveEmployeeClick = (employee: Employee, deptId: number) => {
    setEmployeeToRemove(employee);
    setRemoveDeptId(deptId);
    setRemoveModalOpen(true);
  };

  const handleRemoveEmployeeSuccess = () => {
    refresh && refresh();
  };

  // Expose modal trigger to parent
  useImperativeHandle(ref, () => ({
    openAddModal: () => handleAdd()
  }));

  // Registration Flow
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [registeringDepartment, setRegisteringDepartment] = useState<Department | null>(null);
  const navigate = useNavigate();

  const handleRegisterClick = (dept: Department) => {
    setRegisteringDepartment(dept);
    setIsRegModalOpen(true);
  };

  const handleSelectRegistrationType = (isOld: boolean, duties: string) => {
    setIsRegModalOpen(false);
    if (!registeringDepartment) return;
    const params = new URLSearchParams({
      duties,
      type: isOld ? 'old' : 'hired',
      dept: registeringDepartment.name || ''
    });
    navigate(`/admin-dashboard/register?${params.toString()}`);
  };

  return (
    <div className="w-full">
      {/* Header Section - Modernized */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
            <h2 className="text-xl font-bold text-gray-800">Departments</h2>
            <p className="text-sm text-gray-500">Organize and manage your company structure</p>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
                    onClick={refresh}
                    disabled={loading}
                    title="Refresh"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button 
                    className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-bold"
                    onClick={handleAdd}
                >
                    <Plus size={18} />
                    Add Department
                </button>
            </div>
        </div>
      )}

      <div className={hideHeader ? "" : "bg-white rounded-2xl shadow-sm border border-gray-100 p-6"}>


      {/* Search & Filters */}
      <DepartmentSearch 
        searchTerm={searchTerm} 
        onSearchChange={handleSearchChange} 
        totalRecords={filteredDepartments.length}
        onAdd={handleAdd}
      />

      {/* Main Table */}
      <DepartmentTable 
        departments={filteredDepartments} 
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onRemoveEmployee={handleRemoveEmployeeClick}
        onRegister={handleRegisterClick}
      />

      {/* Add/Edit Modal */}
      <DepartmentFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={async (data) => { await handleModalSubmit(data); }}
        initialData={editingDepartment ? { 
            name: editingDepartment.name,
            description: editingDepartment.description || '', 
            headOfDepartment: editingDepartment.headOfDepartment || '' 
        } : undefined}
      />

      {/* Delete Confirmation Modal */}
      <DepartmentDeleteModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onSuccess={() => {
            // refresh handled by query invalidation or manual refresh
            refresh && refresh();
        }}
        department={departmentToDelete || undefined}
      />

      {/* Remove Employee Modal */}
      {removeDeptId && (
        <RemoveEmployeeModal
          isOpen={removeModalOpen}
          onClose={() => {
            setRemoveModalOpen(false);
            setEmployeeToRemove(null);
            setRemoveDeptId(null);
          }}
          departmentId={removeDeptId}
          employee={employeeToRemove || undefined}
          onSuccess={handleRemoveEmployeeSuccess}
        />
      )}

      {/* Registration Type Selection Modal */}
      <RegistrationTypeModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        departmentName={registeringDepartment?.name || ''}
        onSelectType={handleSelectRegistrationType}
      />
      </div>
    </div>
  );
});

DepartmentList.displayName = 'DepartmentList';

export default DepartmentList;
