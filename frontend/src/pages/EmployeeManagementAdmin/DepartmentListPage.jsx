import { forwardRef, useImperativeHandle } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { 
  useDepartments, 
  DepartmentHeader, 
  DepartmentSearch, 
  DepartmentTable, 
  DepartmentFormModal, 
  DepartmentDeleteModal 
} from '@components/Custom/EmployeeManagement/Admin/Departments';

const DepartmentList = forwardRef(({ hideHeader = false }, ref) => {
  const outletContext = useOutletContext() || { sidebarOpen: true };
  const { sidebarOpen = true } = outletContext;

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

  // Expose modal trigger to parent
  useImperativeHandle(ref, () => ({
    openAddModal: () => handleAdd()
  }));

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
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95 text-sm font-semibold"
                    onClick={handleAdd}
                >
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
      />

      {/* Add/Edit Modal */}
      <DepartmentFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        initialData={editingDepartment}
      />

      {/* Delete Confirmation Modal */}
      <DepartmentDeleteModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        department={departmentToDelete}
        isDeleting={isDeleting}
      />
      </div>
    </div>
  );
});

export default DepartmentList;

